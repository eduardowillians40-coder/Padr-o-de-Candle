'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  Wrench, 
  Settings, 
  LogOut, 
  CandlestickChart,
  ChevronRight,
  Sun,
  Moon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('Auth: Initializing...');
      
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url || url.includes('placeholder-project')) {
        if (mounted) {
          setIsConfigured(false);
          setLoading(false);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (session) {
        console.log('Auth: Session found immediately');
        setUser(session.user);
        setLoading(false);
      } else {
        console.log('Auth: No session found, waiting for sync...');
        const timeout = setTimeout(() => {
          if (mounted) {
            supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
              if (mounted) {
                if (!finalSession) {
                  console.log('Auth: Still no session, redirecting');
                  router.push('/login');
                } else {
                  console.log('Auth: Session found after sync');
                  setUser(finalSession.user);
                }
                setLoading(false);
              }
            });
          }
        }, 2500); // Increased timeout to 2.5s for slower environments
        return () => clearTimeout(timeout);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('Auth: Event changed ->', event);

      if (session) {
        setUser(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Carteiras', icon: Wallet, href: '/wallets' },
    { name: 'Operações', icon: History, href: '/operations' },
    { name: 'Ferramentas', icon: Wrench, href: '/tools', subItems: [
      { name: 'Estratégias de Liquidez', href: '/tools/liquidity' },
      { name: 'Estratégia de Order Block', href: '/tools/order-block' },
      { name: 'Estratégia de ChoCH & SMC', href: '/tools/smc' },
      { name: 'Metodologia Wyckoff', href: '/tools/wyckoff' },
      { name: 'Ondas de Elliott', href: '/tools/elliott' },
      { name: 'Simular Performance', href: '/tools/simulator' },
      { name: 'Sessões de Mercado', href: '/tools/sessions' },
    ]},
    { name: 'Configurações', icon: Settings, href: '/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A15] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#050A15] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30 mb-6">
          <Settings className="w-12 h-12 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Configuração Necessária</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Para que o sistema de autenticação e banco de dados funcione, você precisa adicionar as variáveis de ambiente do Supabase no painel do AI Studio.
        </p>
        <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 text-left w-full max-w-md space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Variável 1</p>
            <code className="block bg-black/30 p-2 rounded text-blue-400 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Variável 2</p>
            <code className="block bg-black/30 p-2 rounded text-blue-400 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050A15]">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0D1425] border-r border-slate-800 transition-all duration-300 flex flex-col z-50",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30 shrink-0">
            <CandlestickChart className="w-6 h-6 text-blue-500" />
          </div>
          {sidebarOpen && (
            <span className="font-display font-bold text-lg text-white whitespace-nowrap">
              Padrão 3 Candles
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                    isActive 
                      ? "bg-blue-600/10 text-blue-500 border border-blue-500/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-500" : "text-slate-400 group-hover:text-slate-200")} />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                  {sidebarOpen && item.subItems && (
                    <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform", isActive && "rotate-90")} />
                  )}
                </Link>
                
                {sidebarOpen && item.subItems && isActive && (
                  <div className="ml-9 mt-2 space-y-1 border-l border-slate-800 pl-4">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={cn(
                          "block py-2 text-sm transition-colors",
                          pathname === sub.href ? "text-blue-500 font-medium" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
            <Sun className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Tema Claro</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#0D1425]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <select className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Todas as carteiras</option>
            </select>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="/operations/new"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Nova Operação
            </Link>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.user_metadata?.full_name || 'Trader Pro'}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">TRADER PRO</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 font-bold">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
