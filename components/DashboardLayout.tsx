'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  Plus,
  Menu,
  X,
  FileText,
  Eye,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050A15] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { preferences, setPreferences } = useUserPreferences();
  const selectedWallet = searchParams.get('wallet') || '';

  const toggleTheme = async () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    setPreferences({ ...preferences, theme: newTheme });
    if (user) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id);
    }
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWallet = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newWallet) {
      params.set('wallet', newWallet);
    } else {
      params.delete('wallet');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(type === 'start' ? 'startDate' : 'endDate', value);
    } else {
      params.delete(type === 'start' ? 'startDate' : 'endDate');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

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
            supabase.auth.getSession().then(({ data: { session: finalSession } }: any) => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
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

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const { data: walletsData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
        const { data: strategiesData } = await supabase.from('strategies').select('*').eq('user_id', user.id);
        if (walletsData) setWallets(walletsData);
        if (strategiesData) setStrategies(strategiesData);
      };
      fetchData();

      // Listener em tempo real
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'strategies' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Carteiras', icon: Wallet, href: '/wallets' },
    { name: 'Operações', icon: History, href: '/operations' },
    { name: 'Ferramentas', icon: Wrench, href: '/tools', subItems: [
      { name: 'Regra dos 3 Times', href: '/tools/regra-3-times' },
      { name: 'Estratégias de Liquidez', href: '/tools/liquidity' },
      { name: 'Estratégia de Order Block', href: '/tools/order-block' },
      { name: 'Estratégia de ChoCH & SMC', href: '/tools/smc' },
      { name: 'Metodologia Wyckoff', href: '/tools/wyckoff' },
      { name: 'Ondas de Elliott', href: '/tools/elliott' },
      { name: 'Simular Performance', href: '/tools/simulator' },
      { name: 'Sessões de Mercado', href: '/tools/sessions' },
      // Estratégias Dinâmicas
      ...strategies.map(s => ({ name: s.name, href: `/tools/strategies/${s.id}` })),
    ]},
    { name: 'Relatórios', icon: FileText, href: '/reports' },
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

  const getPageTitle = (path: string) => {
    const lastPart = path.split('/').pop() || '';
    switch (lastPart) {
      case 'dashboard': return 'Dashboard';
      case 'wallets': return 'Carteiras';
      case 'operations': return 'Operações';
      case 'tools': return 'Ferramentas';
      case 'reports': return 'Relatórios';
      case 'settings': return 'Configurações';
      case 'regra-3-times': return 'Regra dos 3 Times';
      case 'liquidity': return 'Estratégias de Liquidez';
      case 'order-block': return 'Estratégia de Order Block';
      case 'smc': return 'Estratégia de ChoCH & SMC';
      case 'wyckoff': return 'Metodologia Wyckoff';
      case 'elliott': return 'Ondas de Elliott';
      case 'simulator': return 'Simular Performance';
      case 'sessions': return 'Sessões de Mercado';
      default: return lastPart.replace('-', ' ');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050A15]">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0D1425] border-r border-slate-800 transition-all duration-300 flex flex-col z-50 fixed md:relative h-screen shrink-0",
          mobileMenuOpen ? "w-64 translate-x-0" : (sidebarOpen ? "w-64" : "w-20"),
          !mobileMenuOpen && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl shrink-0 relative flex items-center justify-center w-10 h-10 shadow-lg overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0D1425] to-[#050A15] rounded-full flex items-center justify-center relative shadow-inner">
                <Eye className="w-6 h-6 text-emerald-400 absolute" strokeWidth={1.5} />
                <BarChart3 className="w-3 h-3 text-blue-400 absolute mt-0.5" strokeWidth={3} />
              </div>
            </div>
            {sidebarOpen && (
              <span className="font-display font-bold text-lg text-white whitespace-nowrap uppercase">
                TACTICAL EYE
              </span>
            )}
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
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
                        onClick={() => setMobileMenuOpen(false)}
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
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all"
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-5 h-5 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 shrink-0" />
            )}
            {sidebarOpen && <span className="font-medium">{preferences.theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 bg-black md:bg-[#0D1425]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              className="md:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white capitalize hidden sm:block">
              {getPageTitle(pathname)}
            </h2>
            <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block" />
            <select 
              value={selectedWallet}
              onChange={handleWalletChange}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1.5 md:px-3 text-xs md:text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[140px] md:max-w-none truncate"
            >
              <option value="">Todas as carteiras</option>
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
              ))}
            </select>
            
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent text-white text-xs md:text-sm focus:outline-none dark:[color-scheme:dark]"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent text-white text-xs md:text-sm focus:outline-none dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Link 
              href="/operations/new"
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-4 rounded-lg flex items-center gap-2 text-xs md:text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Operação</span>
              <span className="sm:hidden">Nova</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.user_metadata?.full_name || 'Trader Pro'}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">TRADER PRO</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 font-bold text-sm md:text-base">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
