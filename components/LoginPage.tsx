import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { signIn } from '../services/authService';

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.set(logoRef.current, { opacity: 0, y: -30 });
    gsap.set(titleRef.current, { opacity: 0, y: 20 });
    gsap.set(formRef.current, { opacity: 0, y: 30 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

    tl.to(logoRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0);
    tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.2);
    tl.to(formRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.4);
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : error.message);
        return;
      }

      if (data?.user) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        fontFamily: "'Fira Sans', sans-serif"
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div ref={logoRef} className="flex justify-center mb-8" style={{ opacity: 0 }}>
          <div className="flex items-center gap-4">
            <img
              src="/assets/logo-hitlabz.svg"
              alt="Hit Labz"
              className="h-10 opacity-80"
            />
            <div className="w-px h-8 bg-white/20" />
            <img
              src="/assets/logo-inpacto.svg"
              alt="inPacto"
              className="h-10 opacity-80"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-3xl font-bold text-center text-white mb-8"
          style={{ opacity: 0 }}
        >
          Dashboard SuperCopa
        </h1>

        {/* Form Card */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-xl"
          style={{ opacity: 0 }}
        >
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hitlabz.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{ fontFamily: "'Fira Code', monospace" }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
