import { createClient } from '@supabase/supabase-js';
import { DbSession, DbGeneratedImage, DbWhatsAppShare, ImageSize } from '../types';

// Configuração do Supabase - Projeto: supercopa (tdecoglljtghaulaycvd)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tdecoglljtghaulaycvd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZWNvZ2xsanRnaGF1bGF5Y3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzIyNzcsImV4cCI6MjA4NDM0ODI3N30._r1OSfQDdJpCR0H5UFm05D1SEkYx6AVqjfWqnv0BtYc';

// Informações do projeto
export const SUPABASE_PROJECT_INFO = {
  projectId: 'tdecoglljtghaulaycvd',
  projectName: 'supercopa',
  region: 'us-west-2',
  url: supabaseUrl
};

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Cria uma nova sessão no banco de dados
 */
export async function createSession(): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({})
    .select('id')
    .single();

  if (error) {
    console.error('❌ Erro ao criar sessão:', error);
    throw error;
  }

  console.log('✅ Sessão criada:', data.id);
  return data.id;
}

/**
 * Atualiza os dados da sessão
 */
export async function updateSession(
  sessionId: string,
  data: {
    team_id?: string;
    idol_id?: string;
    image_size?: string;
    current_screen?: string;
    completed_at?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('❌ Erro ao atualizar sessão:', error);
    throw error;
  }

  console.log('✅ Sessão atualizada:', sessionId);
}

/**
 * Marca a sessão como completa
 */
export async function completeSession(sessionId: string): Promise<void> {
  await updateSession(sessionId, {
    completed_at: new Date().toISOString()
  });
}

/**
 * Busca uma sessão pelo ID
 */
export async function getSession(sessionId: string): Promise<DbSession | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar sessão:', error);
    return null;
  }

  return data;
}

// ============================================
// IMAGE STORAGE
// ============================================

/**
 * Converte base64 para Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  // Remove o prefixo data:image/...;base64, se existir
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 */
export async function uploadImage(
  base64Image: string,
  sessionId: string,
  type: 'captured' | 'generated'
): Promise<{ path: string; url: string }> {
  const timestamp = Date.now();
  const extension = base64Image.includes('image/png') ? 'png' : 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
  const fileName = `${sessionId}/${type}_${timestamp}.${extension}`;

  const blob = base64ToBlob(base64Image, mimeType);

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    console.error('❌ Erro ao fazer upload da imagem:', error);
    throw error;
  }

  // Gerar URL pública
  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(data.path);

  console.log('✅ Imagem enviada:', data.path);

  return {
    path: data.path,
    url: urlData.publicUrl
  };
}

/**
 * Salva a foto capturada (selfie do usuário)
 */
export async function saveCapturedImage(
  sessionId: string,
  base64Image: string
): Promise<{ path: string; url: string }> {
  return uploadImage(base64Image, sessionId, 'captured');
}

/**
 * Salva a foto gerada pela IA e registra no banco
 */
export async function saveGeneratedImage(
  sessionId: string,
  base64Image: string,
  teamId: string,
  idolId: string,
  imageSize: string,
  promptUsed?: string,
  generationTimeMs?: number
): Promise<{ id: string; path: string; url: string }> {
  // 1. Fazer upload da imagem
  const { path, url } = await uploadImage(base64Image, sessionId, 'generated');

  // 2. Registrar no banco de dados
  const { data, error } = await supabase
    .from('generated_images')
    .insert({
      session_id: sessionId,
      team_id: teamId,
      idol_id: idolId,
      image_size: imageSize,
      storage_path: path,
      storage_url: url,
      prompt_used: promptUsed,
      generation_time_ms: generationTimeMs
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Erro ao registrar imagem gerada:', error);
    throw error;
  }

  console.log('✅ Imagem gerada salva:', data.id);

  return {
    id: data.id,
    path,
    url
  };
}

// ============================================
// WHATSAPP SHARING
// ============================================

/**
 * Registra um compartilhamento via WhatsApp
 */
export async function saveWhatsAppShare(
  sessionId: string,
  generatedImageId: string,
  phoneNumber: string
): Promise<string> {
  const { data, error } = await supabase
    .from('whatsapp_shares')
    .insert({
      session_id: sessionId,
      generated_image_id: generatedImageId,
      phone_number: phoneNumber,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Erro ao registrar compartilhamento:', error);
    throw error;
  }

  console.log('✅ Compartilhamento registrado:', data.id);
  return data.id;
}

/**
 * Atualiza o status do compartilhamento
 */
export async function updateWhatsAppShareStatus(
  shareId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_shares')
    .update({
      status,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', shareId);

  if (error) {
    console.error('❌ Erro ao atualizar status do compartilhamento:', error);
    throw error;
  }

  console.log('✅ Status atualizado:', shareId, status);
}

// ============================================
// ANALYTICS & STATS
// ============================================

/**
 * Busca estatísticas gerais
 */
export async function getStats(): Promise<{
  totalSessions: number;
  completedSessions: number;
  totalImages: number;
  totalShares: number;
  sharesByTeam: { team_id: string; count: number }[];
}> {
  const [sessionsResult, imagesResult, sharesResult, teamStatsResult] = await Promise.all([
    supabase.from('sessions').select('id, completed_at', { count: 'exact' }),
    supabase.from('generated_images').select('id', { count: 'exact' }),
    supabase.from('whatsapp_shares').select('id', { count: 'exact' }),
    supabase.from('sessions').select('team_id').not('team_id', 'is', null)
  ]);

  const completedSessions = sessionsResult.data?.filter(s => s.completed_at !== null).length || 0;

  // Contar por time
  const teamCounts: Record<string, number> = {};
  teamStatsResult.data?.forEach(s => {
    if (s.team_id) {
      teamCounts[s.team_id] = (teamCounts[s.team_id] || 0) + 1;
    }
  });

  return {
    totalSessions: sessionsResult.count || 0,
    completedSessions,
    totalImages: imagesResult.count || 0,
    totalShares: sharesResult.count || 0,
    sharesByTeam: Object.entries(teamCounts).map(([team_id, count]) => ({ team_id, count }))
  };
}

// ============================================
// CONNECTION TESTS
// ============================================

/**
 * Testa a conexão com o Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}> {
  try {
    console.log('🔌 Testando conexão com Supabase...');

    // Teste: Listar tabelas do schema public
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .limit(1);

    if (error) {
      // Se for erro de tabela não encontrada, ainda significa que conectou
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return {
          success: true,
          message: '✅ Conexão estabelecida! Tabelas podem precisar ser criadas.',
          details: { project: SUPABASE_PROJECT_INFO.projectName }
        };
      }
      throw error;
    }

    return {
      success: true,
      message: '✅ Conexão com Supabase estabelecida com sucesso!',
      details: {
        project: SUPABASE_PROJECT_INFO.projectName,
        projectId: SUPABASE_PROJECT_INFO.projectId,
        region: SUPABASE_PROJECT_INFO.region,
        tablesOk: true
      }
    };
  } catch (error: any) {
    console.error('❌ Erro ao testar conexão:', error);
    return {
      success: false,
      message: '❌ Falha na conexão com Supabase',
      error: error?.message || 'Erro desconhecido'
    };
  }
}

/**
 * Testa o storage do Supabase
 */
export async function testSupabaseStorage(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .list('', { limit: 1 });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: '✅ Storage está funcionando!'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Erro no storage: ${error?.message}`
    };
  }
}

/**
 * Testa a saúde geral do Supabase
 */
export async function testSupabaseHealth(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const [connectionTest, storageTest] = await Promise.all([
      testSupabaseConnection(),
      testSupabaseStorage()
    ]);

    const allOk = connectionTest.success && storageTest.success;

    return {
      success: allOk,
      message: allOk ? '✅ Supabase está totalmente operacional!' : '⚠️ Alguns serviços com problemas',
      details: {
        connection: connectionTest.success,
        storage: storageTest.success,
        project: SUPABASE_PROJECT_INFO.projectName,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: '❌ Erro ao verificar saúde do Supabase',
      details: { error: error?.message }
    };
  }
}
