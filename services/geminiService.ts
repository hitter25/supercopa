import { GoogleGenAI } from "@google/genai";
import { ImageSize } from '../types';

// Configuração do Gemini
const getGeminiApiKey = (): string | undefined => {
  // Tenta obter a chave de várias fontes
  return process.env.API_KEY || 
         process.env.GEMINI_API_KEY || 
         import.meta.env.VITE_GEMINI_API_KEY ||
         (window as any).aistudio?.getApiKey?.();
};

// Informações do serviço Gemini
export const GEMINI_SERVICE_INFO = {
  model: 'gemini-3-pro-image-preview',
  service: 'Google Gemini AI',
  version: '3.0'
};

/**
 * Testa a conexão com o Gemini API
 * @returns Promise com o resultado do teste
 */
export async function testGeminiConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}> {
  try {
    console.log('🔌 Testando conexão com Gemini API...');
    
    const apiKey = getGeminiApiKey();
    
    if (!apiKey) {
      // Verificar se está no ambiente AI Studio
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          return {
            success: false,
            message: '❌ Chave de API do Gemini não encontrada',
            error: 'Nenhuma chave de API configurada',
            details: {
              service: GEMINI_SERVICE_INFO.service,
              model: GEMINI_SERVICE_INFO.model,
              note: 'Por favor, selecione uma chave de API no AI Studio ou configure GEMINI_API_KEY no arquivo .env.local'
            }
          };
        }
        // Se tem chave no aistudio, tenta usar
        return {
          success: true,
          message: '✅ Chave de API encontrada no AI Studio',
          details: {
            service: GEMINI_SERVICE_INFO.service,
            model: GEMINI_SERVICE_INFO.model,
            source: 'AI Studio',
            note: 'Chave configurada via AI Studio'
          }
        };
      }
      
      return {
        success: false,
        message: '❌ Chave de API do Gemini não encontrada',
        error: 'Nenhuma chave de API configurada',
        details: {
          service: GEMINI_SERVICE_INFO.service,
          model: GEMINI_SERVICE_INFO.model,
          note: 'Configure GEMINI_API_KEY no arquivo .env.local'
        }
      };
    }
    
    // Testar inicialização do cliente
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Verificar se o cliente foi criado com sucesso
      if (!ai) {
        throw new Error('Falha ao inicializar cliente Gemini');
      }
      
      // Se chegou aqui, a inicialização foi bem-sucedida
      return {
        success: true,
        message: '✅ Conexão com Gemini API estabelecida com sucesso!',
        details: {
          service: GEMINI_SERVICE_INFO.service,
          model: GEMINI_SERVICE_INFO.model,
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          note: 'Cliente Gemini configurado e pronto para gerar imagens. O modelo gemini-3-pro-image-preview será usado para geração de imagens.'
        }
      };
    } catch (initError: any) {
      // Se houver erro na inicialização, verificar o tipo
      if (initError?.message?.includes('API key') || initError?.message?.includes('invalid')) {
        return {
          success: false,
          message: '❌ Chave de API inválida',
          error: initError?.message || 'Chave de API inválida ou expirada',
          details: {
            service: GEMINI_SERVICE_INFO.service,
            model: GEMINI_SERVICE_INFO.model,
            note: 'Verifique se a chave de API está correta e válida'
          }
        };
      }
      throw initError;
    }
  } catch (error: any) {
    console.error('❌ Erro ao testar conexão com Gemini:', error);
    return {
      success: false,
      message: '❌ Falha na conexão com Gemini API',
      error: error?.message || 'Erro desconhecido',
      details: {
        service: GEMINI_SERVICE_INFO.service,
        model: GEMINI_SERVICE_INFO.model,
        errorCode: error?.code,
        errorDetails: error
      }
    };
  }
}

export const generateFanImage = async (
  fanImageBase64: string,
  idolName: string,
  teamName: string,
  size: ImageSize
): Promise<string> => {
  
  // 1. Handle API Key Selection (Required for Pro Image models)
  // Access aistudio from window. Casting to any to avoid TypeScript interface conflicts 
  // if 'aistudio' is already defined in global types with a different signature.
  const aistudio = (window as any).aistudio;
  
  if (aistudio) {
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
      // Assuming prompt success as per instruction not to delay
    }
  }

  // 2. Initialize Gemini Client (Fresh instance)
  // The API key is obtained from process.env.API_KEY which is automatically updated after selection
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não encontrada. Configure GEMINI_API_KEY no .env.local ou selecione uma chave no AI Studio.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // 3. Prepare Prompt & Media
  // Removing data URL prefix for the API if present
  const base64Data = fanImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `A hyper-realistic photo of this fan meeting the football legend ${idolName}, who is wearing a ${teamName} kit.
  The fan and the idol are standing side-by-side in a friendly pose, potentially with an arm around the shoulder or a shared thumbs-up, capturing an authentic moment of connection.
  The expressions should be joyful and natural, as if they are celebrating a victory together.
  The background is a professional football stadium with atmospheric floodlights, slightly blurred to keep focus on the subjects.
  The image quality must be 8k resolution, cinematic lighting, sharp focus, with high-end photography aesthetics.`;

  // Retry logic para lidar com erros 503 (Service Unavailable / Overloaded)
  const maxRetries = 3;
  const baseDelay = 2000; // 2 segundos base
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: 'image/jpeg', // Assuming camera returns jpeg
                data: base64Data
              }
            }
          ],
        },
        config: {
          imageConfig: {
            imageSize: size, // 1K, 2K, or 4K
            aspectRatio: "9:16", // Vertical for mobile/totem
          },
          // Google Search can be used to get accurate details about the Idol's look if needed
          tools: [{ googleSearch: {} }] 
        },
      });

      // 4. Extract Image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image generated in response");

    } catch (error: any) {
      const isRetryableError = error?.error?.code === 503 || 
                              error?.error?.status === 'UNAVAILABLE' ||
                              error?.message?.includes('overloaded') ||
                              error?.message?.includes('503');
      
      if (isRetryableError && attempt < maxRetries - 1) {
        // Calcular delay exponencial: 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Modelo sobrecarregado. Tentando novamente em ${delay/1000}s... (tentativa ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Se não for erro retryable ou já tentou todas as vezes, lança o erro
      console.error("Gemini Generation Error:", error);
      
      if (isRetryableError) {
        throw new Error("O modelo Gemini está sobrecarregado no momento. Por favor, tente novamente em alguns instantes.");
      }
      
      throw error;
    }
  }
  
  throw new Error("Falha ao gerar imagem após múltiplas tentativas");
};