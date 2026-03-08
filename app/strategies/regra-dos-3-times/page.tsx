'use client';

import { ArrowLeft, Brain, Target, Zap, Clock, TrendingUp, Shield, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function RegraDos3TimesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050A15] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-[#0D1425] border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all hover:scale-105"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">Regra dos 3 Times</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Estratégia de Alta Probabilidade e Confirmação Tripla</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Tempo Gráfico</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Análise baseada em 3 tempos diferentes: Macro (Direção), Médio (Contexto) e Micro (Entrada).
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Confirmação</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              A entrada só é permitida quando os 3 tempos estão alinhados na mesma direção.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Execução</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gatilho de entrada ocorre no tempo micro após o pullback no tempo médio.
            </p>
          </motion.div>
        </div>

        {/* Detailed Explanation */}
        <div className="space-y-8">
          <section className="bg-[#0D1425] border border-slate-800 rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-500" />
              Como Funciona?
            </h2>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h4 className="font-bold text-white mb-1 uppercase text-sm">Time 1: O Direcionador (Macro)</h4>
                  <p className="text-sm">Identifique a tendência principal. Se o gráfico diário ou de 4h está em alta, buscamos apenas compras.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h4 className="font-bold text-white mb-1 uppercase text-sm">Time 2: O Contexto (Médio)</h4>
                  <p className="text-sm">Aguarde o preço retornar a uma zona de valor (Média Móvel, Suporte ou FVG) no gráfico de 1h ou 15min.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h4 className="font-bold text-white mb-1 uppercase text-sm">Time 3: O Gatilho (Micro)</h4>
                  <p className="text-sm">No gráfico de 5min ou 1min, procure por um padrão de reversão ou rompimento de estrutura (ChoCH) para entrar.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-[#0D1425] border border-slate-800 rounded-3xl p-8 space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-emerald-500">
                <TrendingUp className="w-5 h-5" />
                Vantagens
              </h2>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Redução drástica de sinais falsos.
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Entradas com Stop Loss curto e Alvo longo.
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Maior confiança na direção do trade.
                </li>
              </ul>
            </section>

            <section className="bg-[#0D1425] border border-slate-800 rounded-3xl p-8 space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-red-500">
                <Shield className="w-5 h-5" />
                Cuidados
              </h2>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Exige paciência para o alinhamento total.
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Evitar operar contra o Time 1 (Macro).
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Atenção a notícias de alto impacto.
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-blue-600/20">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Pronto para aplicar?</h2>
          <p className="text-blue-100 text-sm max-w-md mx-auto">
            Registre suas operações usando esta estratégia e acompanhe sua taxa de acerto no relatório de performance.
          </p>
          <button 
            onClick={() => router.push('/operations/new?strategy=REGRA DOS 3 TIMES')}
            className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg"
          >
            INICIAR NOVA OPERAÇÃO
          </button>
        </div>
      </div>
    </div>
  );
}
