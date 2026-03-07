'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  BarChart2, 
  ShieldCheck, 
  ChevronRight, 
  Target 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DynamicStrategyPage() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();
  
  const [strategy, setStrategy] = useState<any>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchStrategy = async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select('*, strategy_steps(*, checklist_items(*))')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        router.push('/tools/strategies');
        return;
      }
      setStrategy(data);
    };
    fetchStrategy();
  }, [id, supabase, router]);

  if (!strategy) return <div className="p-8 text-white">Carregando estratégia...</div>;

  const steps = strategy.strategy_steps || [];
  const currentStep = steps[activeStepIndex];
  
  const totalQuestions = steps.reduce((acc: number, step: any) => acc + (step.checklist_items?.length || 0), 0);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const reliability = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const toggleAnswer = (itemId: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: !prev[itemId] }));
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

  const resetSetup = () => {
    setAnswers({});
    setActiveStepIndex(0);
    setResult(null);
  };

  const handleExecuteTrade = () => router.push('/operations/new');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{strategy.name}</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">{strategy.description}</p>
        </div>
        <Link href="/tools/strategies" className="ml-auto bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
          Gerenciar Estratégias
        </Link>
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
            {steps.map((step: any, index: number) => (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(index)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                  activeStepIndex === index 
                    ? "bg-blue-600/10 border-blue-500/50 text-white" 
                    : "bg-[#0D1425] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  activeStepIndex === index ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                )}>
                  {index + 1}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{step.name}</span>
                <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform", activeStepIndex === index && "rotate-90")} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Quiz Area */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeStepIndex}
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
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{currentStep.name}</h2>
                  <p className="text-slate-400 text-sm mt-1">{currentStep.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CHECKLIST DE VERIFICAÇÃO</span>
                </div>
                
                {currentStep.checklist_items?.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => toggleAnswer(item.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left",
                      answers[item.id] 
                        ? "bg-emerald-500/5 border-emerald-500/30 text-white" 
                        : "bg-[#050A15] border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      answers[item.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-700"
                    )}>
                      {answers[item.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button 
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-white transition-all disabled:opacity-0"
                >
                  PASSO ANTERIOR
                </button>
                {activeStepIndex < steps.length - 1 ? (
                  <button 
                    onClick={() => setActiveStepIndex(prev => prev + 1)}
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
