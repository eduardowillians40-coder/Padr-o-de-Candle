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
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const steps = [
  {
    id: 1,
    title: 'IDENTIFICAR O ORDER BLOCK',
    description: 'Encontre a última vela contrária antes de um movimento forte.',
    questions: [
      { id: 'q1', label: 'É a última vela de alta antes de uma queda forte (Bearish OB)?' },
      { id: 'q2', label: 'É a última vela de baixa antes de uma alta forte (Bullish OB)?' },
      { id: 'q3', label: 'O movimento subsequente foi explosivo?' },
    ]
  },
  {
    id: 2,
    title: 'DESEQUILÍBRIO (IMBALANCE/FVG)',
    description: 'O movimento deve deixar um Fair Value Gap logo após o OB.',
    questions: [
      { id: 'q4', label: 'Existe um FVG claro logo após o Order Block?' },
      { id: 'q5', label: 'O FVG ainda não foi preenchido?' },
    ]
  },
  {
    id: 3,
    title: 'QUEBRA DE ESTRUTURA (BOS)',
    description: 'O movimento que originou o OB deve ter quebrado a estrutura anterior.',
    questions: [
      { id: 'q6', label: 'Houve um Break of Structure (BOS) claro?' },
      { id: 'q7', label: 'O BOS ocorreu com corpo de vela (não apenas pavio)?' },
    ]
  },
  {
    id: 4,
    title: 'REFINAMENTO E ENTRADA',
    description: 'Aguarde o retorno ao OB para a entrada.',
    questions: [
      { id: 'q8', label: 'O preço está retornando ao OB de forma corretiva (lenta)?' },
      { id: 'q9', label: 'Existe indução (liquidez) antes do OB?' },
      { id: 'q10', label: 'O Stop Loss está posicionado fora do OB?' },
    ]
  }
];

export default function OrderBlockStrategyPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resetSetup = () => {
    setAnswers({});
    setActiveStep(1);
    setResult(null);
  };

  const handleExecuteTrade = () => {
    router.push('/operations/new?strategy=ORDER BLOCK');
  };

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
        suggestion: reliability > 70 ? 'EXECUTAR NO TOQUE' : 'AGUARDAR MAIS CONFIRMAÇÕES',
        score: reliability
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-amber-600/20 p-3 rounded-xl border border-amber-500/30">
          <Target className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">VALIDADOR DE ORDER BLOCKS</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">Identifique zonas de oferta e demanda institucionais de alta probabilidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">CONFIABILIDADE DO OB</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className="text-amber-500 transition-all duration-500"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * reliability) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-white">{reliability}%</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{answeredCount} de {totalQuestions} itens validados</p>
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                  activeStep === step.id 
                    ? "bg-amber-600/10 border-amber-500/50 text-white" 
                    : "bg-[#0D1425] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  activeStep === step.id ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-500"
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
                        ? "bg-amber-500/5 border-amber-500/30 text-white" 
                        : "bg-[#050A15] border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      answers[q.id] ? "bg-amber-500 border-amber-500" : "border-slate-700"
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
                    className="px-12 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {analyzing ? 'ANALISANDO...' : 'ANALISAR OB'}
                    <BarChart2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#050A15] p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">QUALIDADE DO OB</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    result.quality === 'ALTA' ? "text-emerald-500" : result.quality === 'MÉDIA' ? "text-amber-500" : "text-red-500"
                  )}>{result.quality}</p>
                </div>
                <div className="bg-[#050A15] p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">SUGESTÃO</p>
                  <p className="text-lg font-bold text-white uppercase leading-tight">{result.suggestion}</p>
                </div>
                <div className="bg-[#050A15] p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">PONTUAÇÃO</p>
                  <p className="text-2xl font-bold text-amber-500">{result.score}/100</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleExecuteTrade}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  EXECUTAR TRADE (REGISTRAR)
                </button>
                <button 
                  onClick={resetSetup}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  DESCARTAR SETUP
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
