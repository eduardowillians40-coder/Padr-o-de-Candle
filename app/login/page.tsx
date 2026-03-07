'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Lock, Mail, ArrowRight, CandlestickChart, Info } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const message = searchParams.get('message');

  const [isConfigured] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes('placeholder-project');
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Configuração do Supabase ausente. Por favor, adicione as variáveis de ambiente no painel do AI Studio.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050A15]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
            <CandlestickChart className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-white">PADRÃO 3 CANDLES</h1>
        <div className="h-1 w-12 bg-blue-500 mx-auto mt-2 rounded-full" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0D1425] border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white">Bem-vindo!</h2>
          <p className="text-slate-400 text-sm mt-1">Faça login no seu diário de trading profissional.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-medium flex items-start gap-3">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {!isConfigured && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-medium leading-relaxed">
            ⚠️ <strong>Atenção:</strong> O Supabase não está configurado. 
            Adicione <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 
            nas variáveis de ambiente do AI Studio para que o login funcione.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Senha Segura</label>
              <Link href="#" className="text-xs text-blue-500 hover:underline">Esqueci minha senha</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm p-3 rounded-xl text-center flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#050A15] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'ENTRAR NO DASHBOARD'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Não tem uma conta? <Link href="/register" className="text-blue-500 font-semibold hover:underline">CADASTRE-SE</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050A15]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
