'use client';

import { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Target,
  ShieldCheck,
  BarChart2,
  ChevronRight
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
    title: 'ENCONTRAR LIQUIDEZ NÍTIDA',
    description: 'Procure por regiões óbvias de EQL (Equal Lows) ou EQH (Equal Highs).',
    questions: [
      { id: 'q1', label: 'Existem fundos iguais (EQL)?' },
      { id: 'q2', label: 'Existem topos iguais (EQH)?' },
      { id: 'q3', label: 'O suporte/resistência parece "óbvio" demais?' },
    ]
  },
  {
    id: 2,
    title: 'CAPTURA DE LIQUIDEZ EXPRESSIVA',
    description: 'O preço deve varrer a região de liquidez com força.',
    questions: [
      { id: 'q4', label: 'Houve um sweep de liquidez claro?' },
      { id: 'q5', label: 'O preço fechou dentro do range após a varredura?' },
      { id: 'q6', label: 'Existe reação institucional imediata?' },
    ]
  },
  {
    id: 3,
    title: 'DIVERGÊNCIA NO RSI',
    description: 'A divergência confirma a exaustão do movimento de varejo.',
    questions: [
      { id: 'q7', label: 'Existe divergência clara no RSI (14)?' },
      { id: 'q8', label: 'A divergência ocorre em um timeframe maior (H1/H4)?' },
    ]
  },
  {
    id: 4,
    title: 'QUEBRA DE ESTRUTURA (CHOCH)',
    description: 'Confirmação de que o fluxo de ordens mudou.',
    questions: [
      { id: 'q9', label: 'Houve um ChoCH claro (quebra de pavio/corpo)?' },
      { id: 'q10', label: 'O movimento removeu uma indução prévia?' },
      { id: 'q11', label: 'O preço está mostrando intenção direcional?' },
    ]
  },
  {
    id: 5,
    title: 'PONTO DE ENTRADA (OB + INDUÇÃO)',
    description: 'Refinamento da entrada para melhor R:R.',
    questions: [
      { id: 'q12', label: 'Existe um Order Block válido para entrada?' },
      { id: 'q13', label: 'Houve indução antes do toque no OB?' },
      { id: 'q14', label: 'O stop loss está protegido atrás da mínima/máxima?' },
      { id: 'q15', label: 'O alvo (TP) é pelo menos 3x o risco?' },
    ]
  }
];

export default function LiquidityStrategyPage() {
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
        suggestion: reliability > 70 ? 'EXECUÇÃO RECOMENDADA' : 'AGUARDAR MAIS CONFIRMAÇÕES',
        score: reliability
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">VALIDADOR DE ESTRATÉGIAS DE LIQUIDEZ</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">Manual operacional para setups baseados em Smart Money e Captura de Liquidez.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Steps */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">CONFIABILIDADE TOTAL</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className="text-blue-500 transition-all duration-500"
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
                    ? "bg-blue-600/10 border-blue-500/50 text-white" 
                    : "bg-[#0D1425] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  activeStep === step.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                )}>
                  {step.id}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{step.title}</span>
                <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform", activeStep === step.id && "rotate-90")} />
              </button>
            ))}
          </div>

          {/* Model Summary */}
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-500">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">RESUMO MODELO #1</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">FOCO PRINCIPAL</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Identificar regiões de stop-loss de varejo (EQL/EQH) para buscar a liquidez necessária para o movimento.</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">CONFIRMAÇÃO RSI</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">A divergência no RSI valida que o movimento de captura não possui força real por trás.</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">ESTRUTURA (CHOCH)</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">A quebra de estrutura logo após a captura confirma o interesse institucional oposto.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Quiz Area */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8"
            >
              <div className="flex items-start gap-6 mb-8">
                <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30 shrink-0">
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{steps[activeStep-1].title}</h2>
                  <p className="text-slate-400 text-sm mt-1">{steps[activeStep-1].description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CHECKLIST DE VERIFICAÇÃO</span>
                </div>
                
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

              <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-4">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">DICA DE ESPECIALISTA</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Quanto mais nítido o suporte e a resistência, melhor para a captura! O varejo coloca seus stops exatamente ali.</p>
                </div>
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
                    className="px-12 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {analyzing ? 'ANALISANDO...' : 'ANALISAR SETUP'}
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
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-display font-bold text-white uppercase tracking-widest">ANÁLISE DE PROBABILIDADE</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#050A15] p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">QUALIDADE DO SETUP</p>
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
                  <p className="text-2xl font-bold text-blue-500">{result.score}/100</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20">
                  EXECUTAR TRADE (REGISTRAR)
                </button>
                <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">
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
