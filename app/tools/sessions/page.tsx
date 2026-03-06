'use client';

import { useEffect, useState } from 'react';
import { 
  Globe, 
  Clock, 
  Sun, 
  Moon, 
  Coffee,
  Zap,
  Info,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sessions = [
  {
    id: 'asia',
    name: 'SESSÃO ASIÁTICA',
    city: 'TÓQUIO • JP',
    hours: '21:00 — 06:00',
    start: 21,
    end: 6,
    color: 'blue'
  },
  {
    id: 'europe',
    name: 'SESSÃO EUROPEIA',
    city: 'LONDRES • GB',
    hours: '05:00 — 14:00',
    start: 5,
    end: 14,
    color: 'emerald'
  },
  {
    id: 'america',
    name: 'SESSÃO AMERICANA',
    city: 'NOVA IORQUE • US',
    hours: '10:00 — 19:00',
    start: 10,
    end: 19,
    color: 'amber'
  },
  {
    id: 'b3',
    name: 'B3 (BRASIL)',
    city: 'SÃO PAULO • BR',
    hours: '10:15 — 17:55',
    start: 10.25,
    end: 17.9,
    color: 'slate'
  }
];

export default function MarketSessionsPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;

  const isSessionActive = (start: number, end: number) => {
    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      // Overnight sessions (e.g., 21:00 - 06:00)
      return currentHour >= start || currentHour < end;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">SESSÕES DE MERCADO</h1>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-medium uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(now, "HH:mm:ss")} (GMT-3)</span>
          </div>
        </div>

        <div className="flex bg-[#0D1425] p-1 rounded-xl border border-slate-800">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">REFERÊNCIA: <span className="text-blue-500">São Paulo (GMT-3)</span></div>
          <div className="h-6 w-px bg-slate-800 mx-2 self-center" />
          <button className="px-4 py-2 rounded-lg text-[10px] font-bold bg-blue-600 text-white uppercase tracking-widest">HORÁRIO DE VERÃO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sessions.map((session) => {
          const active = isSessionActive(session.start, session.end);
          return (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-[#0D1425] border rounded-2xl p-6 transition-all",
                active ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5" : "border-slate-800"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">{session.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{session.city}</p>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-[8px] font-bold uppercase flex items-center gap-1.5",
                  active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                  {active ? 'ATIVA' : 'FECHADA'}
                </div>
              </div>

              <div className="bg-[#050A15] rounded-xl p-4 border border-slate-800/50 mb-6">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">HORÁRIO DE FUNCIONAMENTO</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{session.hours}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500 uppercase">{active ? 'ENCERRAR EM' : 'ABRE EM'}</span>
                <span className={cn(active ? "text-emerald-500" : "text-red-500")}>12h 39min</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-8 flex gap-6 items-center">
        <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
          <Info className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">OTIMIZE SUAS OPERAÇÕES PELO VOLUME</h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Os maiores picos de volatilidade ocorrem durante os **Overlaps** (sobreposições). O encontro das sessões de Londres e Nova Iorque (10:00 às 14:00 GMT-3) é o período mais líquido do dia.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">STATUS GLOBAL</p>
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest">MERCADO ABERTO</p>
        </div>
      </div>
    </div>
  );
}
