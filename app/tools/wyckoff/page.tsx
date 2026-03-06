'use client';

import { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Target,
  ShieldCheck,
  BarChart2,
  ChevronRight,
  Info,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const steps = [
  {
    id: 1,
    title: 'ACUMULAÇÃO OU DISTRIBUIÇÃO?',
    description: 'Identifique a fase atual do ciclo de mercado.',
    questions: [
      { id: 'q1', label: 'O preço está em um range lateral prolongado?' },
      { id: 'q2', label: 'Existe um Selling Climax (SC) ou Buying Climax (BC) nítido?' },
      { id: 'q3', label: 'O volume está diminuindo durante o range?' },
    ]
  },
  {
    id: 2,
    title: 'TESTE E SPRING/UTAD',
    description: 'A varredura final antes do movimento tendencial.',
    questions: [
      { id: 'q4', label: 'Houve um Spring (falsa quebra de fundo) ou UTAD (falsa quebra de topo)?' },
      { id: 'q5', label: 'O preço retornou rapidamente para dentro do range?' },
    ]
  },
  {
    id: 3,
    title: 'SINAL DE FORÇA (SOS/SOW)',
    description: 'A confirmação de que o range foi rompido com intenção.',
    questions: [
      { id: 'q6', label: 'Houve um Sign of Strength (SOS) ou Sign of Weakness (SOW)?' },
      { id: 'q7', label: 'O rompimento ocorreu com volume expressivo?' },
    ]
  },
  {
    id: 4,
    title: 'BACKUP (LPS/LPSY)',
    description: 'O último ponto de suporte/suprimento antes da tendência.',
    questions: [
      { id: 'q8', label: 'O preço fez um reteste no topo/fundo do range rompido?' },
      { id: 'q9', label: 'O reteste ocorreu com volume baixo?' },
      { id: 'q10', label: 'O R:R para o próximo alvo é favorável?' },
    ]
  }
];

export default function WyckoffStrategyPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const totalQuestions = steps.reduce((acc, step) => acc + step.questions.length, 0);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const reliability = Math.round((answeredCount / totalQuestions) * 100);

  const toggleAnswer = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        quality: reliability > 80 ? 'ALTA' : reliability > 50 ? 'MÉDIA' : 'BAIXA',
        suggestion: reliability > 70 ? 'CICLO CONFIRMADO' : 'AGUARDAR SPRING/UTAD',
        score: reliability
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-600/20 p-3 rounded-xl border border-emerald-500/30">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">METODOLOGIA WYCKOFF</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">Validador de fases de acumulação e distribuição institucional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">CONFLUÊNCIA WYCKOFF</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className="text-emerald-500 transition-all duration-500"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * reliability) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-white">{reliability}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                  activeStep === step.id 
                    ? "bg-emerald-600/10 border-emerald-500/50 text-white" 
                    : "bg-[#0D1425] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  activeStep === step.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500"
                )}>
                  {step.id}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{step.title}</span>
                <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform", activeStep === step.id && "rotate-90")} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">{steps[activeStep-1].title}</h2>
              <p className="text-slate-400 text-sm mb-8">{steps[activeStep-1].description}</p>

              <div className="space-y-4">
                {steps[activeStep-1].questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => toggleAnswer(q.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left",
                      answers[q.id] 
                        ? "bg-emerald-500/5 border-emerald-500/30 text-white" 
                        : "bg-[#050A15] border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      answers[q.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-700"
                    )}>
                      {answers[q.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{q.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button 
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-white transition-all disabled:opacity-0"
                >
                  PASSO ANTERIOR
                </button>
                {activeStep < steps.length ? (
                  <button 
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="px-8 py-3 bg-white text-[#050A15] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
                  >
                    PRÓXIMO PASSO
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="px-12 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {analyzing ? 'ANALISANDO...' : 'ANALISAR CICLO'}
                    <BarChart2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
