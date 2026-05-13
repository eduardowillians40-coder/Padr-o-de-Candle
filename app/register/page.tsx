'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Lock, Mail, User, ArrowRight, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [isConfigured] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes('placeholder-project');
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Configuração do Supabase ausente. Por favor, adicione as variáveis de ambiente no painel do AI Studio.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        // Se a confirmação de email estiver desativada, o usuário já está logado
        router.push('/dashboard');
      } else {
        // Se a confirmação estiver ativada, pede para checar o email
        router.push('/login?message=Conta criada! Verifique seu email para confirmar o cadastro.');
      }
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
          <div className="bg-white rounded-2xl shrink-0 relative flex items-center justify-center w-16 h-16 shadow-2xl overflow-hidden">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0D1425] to-[#050A15] rounded-full flex items-center justify-center relative shadow-inner">
              <Eye className="w-8 h-8 text-emerald-400 absolute" strokeWidth={1.5} />
              <BarChart3 className="w-4 h-4 text-blue-400 absolute mt-1" strokeWidth={3} />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-white uppercase">TACTICAL EYE</h1>
        <div className="h-1 w-12 bg-blue-500 mx-auto mt-2 rounded-full" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0D1425] border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white">Criar Conta</h2>
          <p className="text-slate-400 text-sm mt-1">Comece sua jornada profissional hoje.</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-medium leading-relaxed">
            ⚠️ <strong>Atenção:</strong> O Supabase não está configurado. 
            Adicione <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 
            nas variáveis de ambiente do AI Studio para que o registro funcione.
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Seu Nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
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
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Senha</label>
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'CRIAR MINHA CONTA'}
            <UserPlus className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Já tem uma conta? <Link href="/login" className="text-blue-500 font-semibold hover:underline">FAZER LOGIN</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
