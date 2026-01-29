import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { testGeminiConnection } from '../services/geminiService';
import Button from './Button';

const GeminiTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    error?: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setResult(null);
    
    try {
      const connectionResult = await testGeminiConnection();
      setResult(connectionResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: '❌ Erro ao executar teste',
        error: error?.message || 'Erro desconhecido'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-lg p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold mb-4 text-white">Teste de Conexão Gemini</h2>
        
        <Button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="w-full mb-4"
        >
          {isTesting ? 'Testando...' : 'Testar Conexão Gemini'}
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-lg ${
              result.success
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            <p className={`font-semibold mb-2 ${
              result.success ? 'text-green-300' : 'text-red-300'
            }`}>
              {result.message}
            </p>
            
            {result.error && (
              <p className="text-red-300 text-sm mb-2">
                Erro: {result.error}
              </p>
            )}
            
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-300 hover:text-white">
                  Ver detalhes
                </summary>
                <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-auto max-h-40 text-gray-300">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default GeminiTest;
