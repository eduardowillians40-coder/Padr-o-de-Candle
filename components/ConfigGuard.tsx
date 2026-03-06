'use client';

import { AlertCircle, ExternalLink, Settings, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ConfigGuard({ children }: { children: React.ReactNode }) {
  const isConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key';

  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#050A15] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-[#0D1425] border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Configuração Necessária</h1>
              <p className="text-slate-400 text-sm">O Supabase ainda não foi conectado.</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-slate-300 leading-relaxed">
              Para que o diário de trading funcione, você precisa conectar seu projeto do Supabase. 
              Siga os passos abaixo para configurar as variáveis de ambiente:
            </p>

            <div className="grid gap-4">
              <div className="bg-[#050A15] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">1</span>
                  Crie um projeto no Supabase
                </h3>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  Ir para Supabase Dashboard <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-[#050A15] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">2</span>
                  Execute o Schema SQL
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Copie o conteúdo do arquivo <code className="text-blue-400">supabase_schema.sql</code> e execute no SQL Editor do Supabase.
                </p>
              </div>

              <div className="bg-[#050A15] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">3</span>
                  Configure as Variáveis no AI Studio
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Adicione as seguintes chaves no painel de <strong>Secrets</strong>:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#0D1425] p-3 rounded-xl border border-slate-800">
                    <code className="text-xs text-blue-400">NEXT_PUBLIC_SUPABASE_URL</code>
                    <button 
                      onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_URL', 'url')}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {copied === 'url' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#0D1425] p-3 rounded-xl border border-slate-800">
                    <code className="text-xs text-blue-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    <button 
                      onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'key')}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {copied === 'key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                Após adicionar as variáveis, a página será atualizada automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
