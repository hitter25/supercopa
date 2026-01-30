/**
 * Webhook Service para integração com N8N
 * Envia dados para o webhook após o usuário clicar em enviar para WhatsApp
 */

// URL do webhook N8N - configurada via variável de ambiente
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export interface WebhookPayload {
  // Identificadores da sessão
  sessionId: string;
  generatedImageId: string;
  shareId: string;

  // Dados do usuário
  phoneNumber: string;

  // Dados da imagem
  imageUrl: string;

  // Contexto da sessão
  teamId: string;
  teamName: string;
  idolId: string;
  idolName: string;
  idolNickname: string;

  // Metadados
  timestamp: string;
  imageSize: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Verifica se o webhook está configurado
 */
export function isWebhookConfigured(): boolean {
  return !!N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.length > 0;
}

/**
 * Obtém a URL do webhook configurada
 */
export function getWebhookUrl(): string {
  return N8N_WEBHOOK_URL;
}

/**
 * Envia dados para o webhook N8N após o usuário clicar em enviar para WhatsApp
 *
 * Este webhook é disparado quando:
 * 1. O usuário completa o fluxo do totem
 * 2. Insere o número de telefone
 * 3. Clica em "Enviar Foto"
 *
 * O N8N pode então processar e enviar via WhatsApp Business API
 */
export async function triggerWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
  // Verificar se o webhook está configurado
  if (!isWebhookConfigured()) {
    console.warn('⚠️ Webhook N8N não configurado. Configure VITE_N8N_WEBHOOK_URL no .env.local');
    return {
      success: false,
      message: 'Webhook não configurado',
      error: 'VITE_N8N_WEBHOOK_URL não está definido'
    };
  }

  console.log('🚀 Disparando webhook N8N...');
  console.log('📍 URL:', N8N_WEBHOOK_URL);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Headers adicionais de segurança (opcional - configurar no N8N)
        'X-Source': 'supercopa-totem',
        'X-Timestamp': new Date().toISOString(),
      },
      body: JSON.stringify(payload),
    });

    // Verificar se a resposta foi bem sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta do webhook:', response.status, errorText);
      return {
        success: false,
        message: `Erro HTTP ${response.status}`,
        error: errorText
      };
    }

    // Tentar parsear a resposta como JSON
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        // Se não conseguir parsear, ignora
        responseData = null;
      }
    }

    console.log('✅ Webhook disparado com sucesso!');
    console.log('📨 Resposta:', responseData);

    return {
      success: true,
      message: 'Webhook disparado com sucesso',
      data: responseData
    };

  } catch (error: any) {
    console.error('❌ Erro ao disparar webhook:', error);

    // Tratar erros de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Erro de conexão com o webhook',
        error: 'Não foi possível conectar ao servidor N8N. Verifique a URL e a conexão.'
      };
    }

    return {
      success: false,
      message: 'Erro ao disparar webhook',
      error: error.message || 'Erro desconhecido'
    };
  }
}

/**
 * Testa a conexão com o webhook N8N
 * Útil para verificar se o webhook está respondendo
 */
export async function testWebhookConnection(): Promise<WebhookResponse> {
  if (!isWebhookConfigured()) {
    return {
      success: false,
      message: 'Webhook não configurado',
      error: 'Configure VITE_N8N_WEBHOOK_URL no arquivo .env.local'
    };
  }

  console.log('🔌 Testando conexão com webhook N8N...');

  try {
    // Enviar payload de teste
    const testPayload = {
      test: true,
      message: 'Teste de conexão do Totem SuperCopa',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'supercopa-totem-test',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return {
        success: true,
        message: '✅ Conexão com webhook estabelecida!'
      };
    } else {
      return {
        success: false,
        message: `❌ Webhook retornou status ${response.status}`,
        error: await response.text()
      };
    }

  } catch (error: any) {
    return {
      success: false,
      message: '❌ Falha na conexão com webhook',
      error: error.message
    };
  }
}
