import { supabase } from './supabaseService';
import { TEAMS, IDOLS } from '../constants';
import { TeamId } from '../types';

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  totalImages: number;
  totalShares: number;
  successfulShares: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IdolStats {
  idolId: string;
  idolName: string;
  idolNickname: string;
  teamId: string;
  count: number;
  percentage: number;
}

export interface HourlyStats {
  hour: number;
  count: number;
}

export interface WhatsAppStats {
  pending: number;
  sent: number;
  failed: number;
  successRate: number;
}

export interface PerformanceStats {
  avgGenerationTime: number;
  minGenerationTime: number;
  maxGenerationTime: number;
  successRate: number;
  totalGenerated: number;
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Busca estatísticas gerais do dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [sessionsResult, imagesResult, sharesResult] = await Promise.all([
    supabase.from('sessions').select('id, completed_at', { count: 'exact' }),
    supabase.from('generated_images').select('id', { count: 'exact' }),
    supabase.from('whatsapp_shares').select('id, status', { count: 'exact' })
  ]);

  const totalSessions = sessionsResult.count || 0;
  const completedSessions = sessionsResult.data?.filter(s => s.completed_at !== null).length || 0;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const totalImages = imagesResult.count || 0;
  const totalShares = sharesResult.count || 0;
  const successfulShares = sharesResult.data?.filter(s => s.status === 'sent').length || 0;

  return {
    totalSessions,
    completedSessions,
    completionRate,
    totalImages,
    totalShares,
    successfulShares
  };
}

/**
 * Busca sessões agrupadas por time
 */
export async function getSessionsByTeam(): Promise<TeamStats[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('team_id')
    .not('team_id', 'is', null);

  if (error) {
    console.error('Erro ao buscar sessões por time:', error);
    return [];
  }

  const teamCounts: Record<string, number> = {};
  let total = 0;

  data?.forEach(session => {
    if (session.team_id) {
      teamCounts[session.team_id] = (teamCounts[session.team_id] || 0) + 1;
      total++;
    }
  });

  const teamColors: Record<string, string> = {
    [TeamId.FLAMENGO]: '#C3281E',
    [TeamId.CORINTHIANS]: '#333333'
  };

  return Object.entries(teamCounts).map(([teamId, count]) => ({
    teamId,
    teamName: TEAMS[teamId as TeamId]?.name || teamId,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
    color: teamColors[teamId] || '#666666'
  }));
}

/**
 * Busca sessões agrupadas por ídolo
 */
export async function getSessionsByIdol(): Promise<IdolStats[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('idol_id')
    .not('idol_id', 'is', null);

  if (error) {
    console.error('Erro ao buscar sessões por ídolo:', error);
    return [];
  }

  const idolCounts: Record<string, number> = {};
  let total = 0;

  data?.forEach(session => {
    if (session.idol_id) {
      idolCounts[session.idol_id] = (idolCounts[session.idol_id] || 0) + 1;
      total++;
    }
  });

  return Object.entries(idolCounts)
    .map(([idolId, count]) => {
      const idol = IDOLS.find(i => i.id === idolId);
      return {
        idolId,
        idolName: idol?.name || idolId,
        idolNickname: idol?.nickname || '',
        teamId: idol?.teamId || '',
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Busca sessões por hora (últimas 24h)
 */
export async function getSessionsByHour(): Promise<HourlyStats[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select('created_at')
    .gte('created_at', twentyFourHoursAgo);

  if (error) {
    console.error('Erro ao buscar sessões por hora:', error);
    return [];
  }

  // Inicializar array com 24 horas
  const hourlyData: HourlyStats[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0
  }));

  data?.forEach(session => {
    const date = new Date(session.created_at);
    const hour = date.getHours();
    hourlyData[hour].count++;
  });

  return hourlyData;
}

/**
 * Busca estatísticas de WhatsApp
 */
export async function getWhatsAppStats(): Promise<WhatsAppStats> {
  const { data, error } = await supabase
    .from('whatsapp_shares')
    .select('status');

  if (error) {
    console.error('Erro ao buscar stats de WhatsApp:', error);
    return { pending: 0, sent: 0, failed: 0, successRate: 0 };
  }

  const stats = {
    pending: 0,
    sent: 0,
    failed: 0
  };

  data?.forEach(share => {
    if (share.status === 'pending') stats.pending++;
    else if (share.status === 'sent') stats.sent++;
    else if (share.status === 'failed') stats.failed++;
  });

  const total = stats.pending + stats.sent + stats.failed;
  const successRate = total > 0 ? (stats.sent / total) * 100 : 0;

  return { ...stats, successRate };
}

/**
 * Busca estatísticas de performance de geração
 */
export async function getGenerationPerformance(): Promise<PerformanceStats> {
  const { data, error } = await supabase
    .from('generated_images')
    .select('generation_time_ms')
    .not('generation_time_ms', 'is', null);

  if (error) {
    console.error('Erro ao buscar performance de geração:', error);
    return {
      avgGenerationTime: 0,
      minGenerationTime: 0,
      maxGenerationTime: 0,
      successRate: 100,
      totalGenerated: 0
    };
  }

  const times = data
    ?.map(d => d.generation_time_ms)
    .filter((t): t is number => t !== null && t > 0) || [];

  if (times.length === 0) {
    return {
      avgGenerationTime: 0,
      minGenerationTime: 0,
      maxGenerationTime: 0,
      successRate: 100,
      totalGenerated: 0
    };
  }

  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    avgGenerationTime: Math.round(avg),
    minGenerationTime: min,
    maxGenerationTime: max,
    successRate: 100,
    totalGenerated: times.length
  };
}

/**
 * Busca todas as estatísticas do dashboard de uma vez
 */
export async function getAllDashboardData(): Promise<{
  stats: DashboardStats;
  teams: TeamStats[];
  idols: IdolStats[];
  hourly: HourlyStats[];
  whatsapp: WhatsAppStats;
  performance: PerformanceStats;
}> {
  const [stats, teams, idols, hourly, whatsapp, performance] = await Promise.all([
    getDashboardStats(),
    getSessionsByTeam(),
    getSessionsByIdol(),
    getSessionsByHour(),
    getWhatsAppStats(),
    getGenerationPerformance()
  ]);

  return { stats, teams, idols, hourly, whatsapp, performance };
}
