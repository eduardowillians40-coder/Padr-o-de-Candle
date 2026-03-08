'use client';

import { 
  Clock, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function Regra3TimesPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">REGRA DOS 3 TIMES</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Alinhamento de Timeframes para Entradas Precisas</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 space-y-16">
          
          {/* Top Level: Macro vs Direcional */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
            
            {/* Análise Macro */}
            <div className="flex-1 w-full max-w-xs">
              <div className="bg-gradient-to-b from-blue-900/50 to-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-center shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">ANÁLISE MACRO</h2>
                <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-blue-500/30" />
              </div>
              
              <div className="mt-8 bg-[#050A15] border border-slate-800 rounded-xl p-5 relative">
                <div className="absolute -top-px left-1/2 w-4 h-4 rounded-full border-2 border-blue-500 bg-[#050A15] -translate-x-1/2 -translate-y-1/2" />
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Range HTF
                </h3>
                <ul className="space-y-3">
                  {['Anual', 'Semanal', 'Diário'].map((tf, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                      <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/50 rounded-sm" />
                      {tf}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Range Direcional */}
            <div className="flex-[2] w-full">
              <div className="bg-gradient-to-b from-amber-900/50 to-amber-900/20 border border-amber-500/30 rounded-xl p-4 text-center shadow-[0_0_30px_rgba(245,158,11,0.15)] relative">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Range Direcional</h2>
                <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-amber-500/30" />
                {/* Horizontal connector line */}
                <div className="absolute -bottom-8 left-[16.66%] right-[16.66%] h-px bg-amber-500/30" />
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 4H Column */}
                <div className="space-y-4 relative">
                  <div className="absolute -top-8 left-1/2 w-px h-8 bg-amber-500/30" />
                  <div className="bg-gradient-to-b from-amber-600/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-3 text-center">
                    <span className="text-lg font-bold text-amber-500">4H</span>
                  </div>
                  
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                      <span className="text-xs font-bold text-white">1H</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Entrada Ideal</span>
                    </div>
                    <div className="flex items-center justify-between pl-4 border-l-2 border-slate-800">
                      <span className="text-xs font-bold text-slate-400">15M</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Alternativa</span>
                    </div>
                  </div>

                  <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-500">Internas</span>
                      <ArrowRight className="w-3 h-3 text-amber-500/50" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">3ª Opção</span>
                    </div>
                    <p className="text-[9px] text-amber-500/70 leading-relaxed">
                      ✓ Só se o fluxo estiver a favor, não na reversão
                    </p>
                  </div>
                </div>

                {/* 1H Column */}
                <div className="space-y-4 relative">
                  <div className="absolute -top-8 left-1/2 w-px h-8 bg-amber-500/30" />
                  <div className="bg-gradient-to-b from-amber-600/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-3 text-center">
                    <span className="text-lg font-bold text-amber-500">1H</span>
                  </div>
                  
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                      <span className="text-xs font-bold text-white">15M</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Entrada Ideal</span>
                    </div>
                    <div className="flex items-center justify-between pl-4 border-l-2 border-slate-800">
                      <span className="text-xs font-bold text-slate-400">5M</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Alternativa</span>
                    </div>
                  </div>

                  <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-500">Internas</span>
                      <ArrowRight className="w-3 h-3 text-amber-500/50" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">3ª Opção</span>
                    </div>
                    <p className="text-[9px] text-amber-500/70 leading-relaxed">
                      ✓ Só se o fluxo estiver a favor, não na reversão
                    </p>
                  </div>
                </div>

                {/* 15M Column */}
                <div className="space-y-4 relative">
                  <div className="absolute -top-8 left-1/2 w-px h-8 bg-amber-500/30" />
                  <div className="bg-gradient-to-b from-amber-600/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-3 text-center">
                    <span className="text-lg font-bold text-amber-500">15M</span>
                  </div>
                  
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                      <span className="text-xs font-bold text-white">5M</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Entrada Ideal</span>
                    </div>
                    <div className="flex items-center justify-between pl-4 border-l-2 border-slate-800">
                      <span className="text-xs font-bold text-slate-400">1M</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Alternativa</span>
                    </div>
                  </div>

                  <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-500">Internas</span>
                      <ArrowRight className="w-3 h-3 text-amber-500/50" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">3ª Opção</span>
                    </div>
                    <p className="text-[9px] text-amber-500/70 leading-relaxed">
                      ✓ Só se o fluxo estiver a favor, não na reversão
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Warnings Section */}
          <div className="space-y-4 mt-12">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-1">ATENÇÃO</h4>
                <p className="text-xs text-red-400/80 uppercase tracking-wider">
                  Se houver INEFICIÊNCIA EM QUALQUER ALINHAMENTO <ArrowRight className="inline w-3 h-3 mx-1" /> ESPERAR CONFIRMAÇÃO EXTRA!
                </p>
              </div>
            </div>

            <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-500/80 uppercase tracking-wider leading-relaxed">
                Se for trabalhar FORA DA REGRA DOS 3 TIMES em algum Range Direcional (4H, 1H ou 15M)
                <br />
                <span className="text-amber-500 font-bold mt-2 inline-block border-b border-amber-500/30 pb-1">
                  <ArrowRight className="inline w-3 h-3 mr-2" />
                  ESPERAR DUPLA CONFIRMAÇÃO
                </span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Link 
          href="/operations/new?strategy=REGRA DOS 3 TIMES"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Target className="w-5 h-5" />
          REGISTRAR OPERAÇÃO COM ESTA REGRA
        </Link>
      </div>
    </div>
  );
}
