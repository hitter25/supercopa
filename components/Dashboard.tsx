import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { signOut } from '../services/authService';
import {
  getAllDashboardData,
  DashboardStats,
  TeamStats,
  IdolStats,
  HourlyStats,
  WhatsAppStats,
  PerformanceStats
} from '../services/analyticsService';
import type { User } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardData {
  stats: DashboardStats;
  teams: TeamStats[];
  idols: IdolStats[];
  hourly: HourlyStats[];
  whatsapp: WhatsAppStats;
  performance: PerformanceStats;
}

// ============================================
// COLOR PALETTE
// ============================================

const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  flamengo: '#C3281E',
  corinthians: '#333333',
  accent: '#F59E0B',
  success: '#22C55E',
  chartPrimary: '#3B82F6',
  chartSecondary: '#60A5FA',
  border: '#334155'
};

// ============================================
// SKELETON COMPONENTS
// ============================================

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded-2xl ${className}`}>
    <div className="p-6">
      <div className="h-4 bg-slate-600/50 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-slate-600/50 rounded w-2/3"></div>
    </div>
  </div>
);

const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-slate-700/50 rounded-2xl p-6 h-64">
    <div className="h-4 bg-slate-600/50 rounded w-1/4 mb-4"></div>
    <div className="h-full bg-slate-600/30 rounded"></div>
  </div>
);

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = COLORS.chartPrimary
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.from(cardRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power2.out'
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div
        className="text-4xl font-bold mb-1"
        style={{ fontFamily: "'Fira Code', monospace", color: COLORS.textPrimary }}
      >
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      {subtitle && (
        <span className="text-slate-400 text-sm">{subtitle}</span>
      )}
    </div>
  );
};

// ============================================
// TEAM CHART COMPONENT
// ============================================

interface TeamChartProps {
  data: TeamStats[];
}

const TeamChart: React.FC<TeamChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Sessoes por Time</h3>
        <p className="text-slate-400 text-center py-8">Nenhum dado disponivel</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Sessoes por Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
          <XAxis type="number" stroke={COLORS.textSecondary} fontSize={12} />
          <YAxis
            type="category"
            dataKey="teamName"
            stroke={COLORS.textSecondary}
            fontSize={14}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontFamily: "'Fira Code', monospace"
            }}
            labelStyle={{ color: COLORS.textPrimary }}
            formatter={(value: number, name: string, props: any) => [
              `${value} (${props.payload.percentage.toFixed(1)}%)`,
              'Sessoes'
            ]}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// IDOL RANKING COMPONENT
// ============================================

interface IdolRankingProps {
  data: IdolStats[];
}

const IdolRanking: React.FC<IdolRankingProps> = ({ data }) => {
  const topIdols = data.slice(0, 6);
  const maxCount = Math.max(...topIdols.map(d => d.count), 1);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Ranking de Idolos</h3>
      {topIdols.length === 0 ? (
        <p className="text-slate-400 text-center py-8">Nenhum dado disponivel</p>
      ) : (
        <div className="space-y-4">
          {topIdols.map((idol, index) => (
            <div key={idol.idolId} className="flex items-center gap-4">
              <span
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: index < 3 ? `${COLORS.accent}20` : `${COLORS.textSecondary}10`,
                  color: index < 3 ? COLORS.accent : COLORS.textSecondary
                }}
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{idol.idolName}</span>
                  <span
                    className="text-sm font-mono"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {idol.count}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(idol.count / maxCount) * 100}%`,
                      backgroundColor: idol.teamId === 'FLAMENGO' ? COLORS.flamengo : COLORS.corinthians
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// HOURLY CHART COMPONENT
// ============================================

interface HourlyChartProps {
  data: HourlyStats[];
}

const HourlyChart: React.FC<HourlyChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    hourLabel: `${d.hour.toString().padStart(2, '0')}h`
  }));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Sessoes por Hora (24h)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.chartPrimary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.chartPrimary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
          <XAxis
            dataKey="hourLabel"
            stroke={COLORS.textSecondary}
            fontSize={11}
            tickLine={false}
            interval={2}
          />
          <YAxis stroke={COLORS.textSecondary} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontFamily: "'Fira Code', monospace"
            }}
            labelStyle={{ color: COLORS.textPrimary }}
            formatter={(value: number) => [`${value} sessoes`, 'Total']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={COLORS.chartPrimary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// CONVERSION FUNNEL COMPONENT
// ============================================

interface ConversionFunnelProps {
  stats: DashboardStats;
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ stats }) => {
  const imageRate = stats.totalSessions > 0
    ? ((stats.totalImages / stats.totalSessions) * 100).toFixed(1)
    : '0';
  const shareRate = stats.totalImages > 0
    ? ((stats.successfulShares / stats.totalImages) * 100).toFixed(1)
    : '0';

  const steps = [
    { label: 'Sessoes', value: stats.totalSessions, color: COLORS.chartPrimary },
    { label: 'Imagens', value: stats.totalImages, rate: imageRate, color: COLORS.chartSecondary },
    { label: 'WhatsApp', value: stats.successfulShares, rate: shareRate, color: COLORS.success }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Funil de Conversao</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{step.label}</span>
              <span
                className="font-mono text-lg"
                style={{ color: step.color }}
              >
                {step.value.toLocaleString('pt-BR')}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex items-center gap-2 text-slate-400 text-sm pl-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>{steps[index + 1].rate}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// PERFORMANCE PANEL COMPONENT
// ============================================

interface PerformancePanelProps {
  performance: PerformanceStats;
  whatsapp: WhatsAppStats;
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({ performance, whatsapp }) => {
  const formatTime = (ms: number) => {
    if (ms === 0) return '0s';
    const seconds = ms / 1000;
    return seconds >= 60 ? `${(seconds / 60).toFixed(1)}min` : `${seconds.toFixed(1)}s`;
  };

  const metrics = [
    {
      label: 'Tempo Medio',
      value: formatTime(performance.avgGenerationTime),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'WhatsApp Sucesso',
      value: `${whatsapp.successRate.toFixed(1)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Total Gerado',
      value: performance.totalGenerated.toLocaleString('pt-BR'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: 'WA Pendente',
      value: whatsapp.pending.toLocaleString('pt-BR'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Performance</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
              {metric.icon}
            </div>
            <div>
              <div className="text-xs text-slate-400">{metric.label}</div>
              <div className="text-white font-mono font-semibold">{metric.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Enable scrolling for dashboard (override global overflow:hidden)
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'auto';

    return () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (root) root.style.overflow = 'hidden';
    };
  }, []);

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const dashboardData = await getAllDashboardData();
      setData(dashboardData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useGSAP(() => {
    if (!headerRef.current || isLoading) return;
    gsap.from(headerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: 'power2.out'
    });
  }, { scope: headerRef, dependencies: [isLoading] });

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen p-6"
        style={{
          background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.cardBg} 50%, ${COLORS.background} 100%)`,
          fontFamily: "'Fira Sans', sans-serif"
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse h-16 bg-slate-700/50 rounded-2xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen p-6 pb-12"
      style={{
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.cardBg} 50%, ${COLORS.background} 100%)`,
        fontFamily: "'Fira Sans', sans-serif"
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo-hitlabz.svg" alt="Hit Labz" className="h-8 opacity-80" />
              <div className="w-px h-6 bg-slate-600" />
              <img src="/assets/logo-inpacto.svg" alt="inPacto" className="h-8 opacity-80" />
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-600" />
            <h1 className="text-xl font-bold text-white">Dashboard SuperCopa</h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {lastUpdate && (
              <span className="text-xs text-slate-500">
                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all disabled:opacity-50"
              title="Atualizar dados"
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-red-600/50 text-slate-400 hover:text-white text-sm font-medium transition-all"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Sessoes"
            value={data?.stats.totalSessions || 0}
            subtitle="Total"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color={COLORS.chartPrimary}
          />
          <StatCard
            title="Completas"
            value={data?.stats.completedSessions || 0}
            subtitle={`${data?.stats.completionRate.toFixed(1) || 0}%`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color={COLORS.success}
          />
          <StatCard
            title="Imagens"
            value={data?.stats.totalImages || 0}
            subtitle="Geradas"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color={COLORS.accent}
          />
          <StatCard
            title="WhatsApp"
            value={data?.stats.successfulShares || 0}
            subtitle="Enviados"
            icon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            }
            color="#25D366"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TeamChart data={data?.teams || []} />
          <IdolRanking data={data?.idols || []} />
        </div>

        {/* Hourly Chart */}
        <div className="mb-8">
          <HourlyChart data={data?.hourly || []} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel stats={data?.stats || {
            totalSessions: 0,
            completedSessions: 0,
            completionRate: 0,
            totalImages: 0,
            totalShares: 0,
            successfulShares: 0
          }} />
          <PerformancePanel
            performance={data?.performance || {
              avgGenerationTime: 0,
              minGenerationTime: 0,
              maxGenerationTime: 0,
              successRate: 0,
              totalGenerated: 0
            }}
            whatsapp={data?.whatsapp || {
              pending: 0,
              sent: 0,
              failed: 0,
              successRate: 0
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Dashboard SuperCopa - Hit Labz &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
