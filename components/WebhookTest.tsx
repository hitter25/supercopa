import React, { useState } from 'react';
import {
  testWebhookConnection,
  isWebhookConfigured,
  getWebhookUrl
} from '../services/webhookService';

/**
 * Componente para testar a conexão com o webhook N8N
 * Útil durante o desenvolvimento e configuração
 */
const WebhookTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  const handleTest = async () => {
    setStatus('testing');
    setMessage('Testando conexão...');
    setDetails('');

    const result = await testWebhookConnection();

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('error');
      setMessage(result.message);
      setDetails(result.error || '');
    }
  };

  const isConfigured = isWebhookConfigured();
  const webhookUrl = getWebhookUrl();

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-purple-500/30 max-w-sm">
      <h3 className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>🔗</span> Webhook N8N Test
      </h3>

      {/* Status da configuração */}
      <div className="mb-3 text-xs">
        <div className={`flex items-center gap-2 ${isConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
          <span>{isConfigured ? '✓' : '⚠️'}</span>
          <span>{isConfigured ? 'Webhook configurado' : 'Webhook não configurado'}</span>
        </div>
        {webhookUrl && (
          <div className="text-gray-500 mt-1 truncate" title={webhookUrl}>
            URL: {webhookUrl.substring(0, 40)}...
          </div>
        )}
      </div>

      {/* Status do teste */}
      {status !== 'idle' && (
        <div className={`mb-3 p-2 rounded text-xs ${
          status === 'testing' ? 'bg-blue-900/50 text-blue-300' :
          status === 'success' ? 'bg-green-900/50 text-green-300' :
          'bg-red-900/50 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'testing' && (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{message}</span>
          </div>
          {details && (
            <div className="mt-1 text-xs opacity-70">{details}</div>
          )}
        </div>
      )}

      {/* Botão de teste */}
      <button
        onClick={handleTest}
        disabled={status === 'testing'}
        className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
      >
        {status === 'testing' ? 'Testando...' : 'Testar Conexão'}
      </button>

      {/* Instruções */}
      {!isConfigured && (
        <div className="mt-3 text-xs text-gray-500">
          Configure <code className="text-purple-400">VITE_N8N_WEBHOOK_URL</code> no arquivo <code className="text-purple-400">.env.local</code>
        </div>
      )}
    </div>
  );
};

export default WebhookTest;
