'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  CreditCard,
  Plus,
  Trash2,
  Camera,
  Save,
  LogOut,
  Zap,
  CheckCircle2,
  Coins,
  Brain,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';

const STANDARD_TRIGGERS = [
  'Rompimento de Topo/Fundo',
  'Pullback na Média',
  'Cruzamento de Médias',
  'Suporte/Resistência',
  'Volume Climático'
];

export default function SettingsPage() {
  const supabase = createClient();
  const { setPreferences } = useUserPreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: '',
    username: '',
    phone: '',
    currency: 'BRL',
    theme: 'dark',
    email: '',
    avatar_url: '',
    ai_provider: 'gemini',
    gemini_api_key: '',
    claude_api_key: '',
    openai_api_key: ''
  });
  const [triggers, setTriggers] = useState<any[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [testingAI, setTestingAI] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          username: profileData.username || '',
          phone: profileData.phone || '',
          currency: profileData.currency || 'BRL',
          theme: profileData.theme || 'dark',
          email: user.email || '',
          avatar_url: profileData.avatar_url || '',
          ai_provider: profileData.ai_provider || 'gemini',
          gemini_api_key: profileData.gemini_api_key || '',
          claude_api_key: profileData.claude_api_key || '',
          openai_api_key: profileData.openai_api_key || ''
        });
      }

      // Fetch Triggers
      const { data: triggerData } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      setTriggers(triggerData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, refresh]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      alert('Erro ao fazer upload da imagem: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      alert('Erro ao atualizar perfil com nova imagem: ' + updateError.message);
    } else {
      setRefresh(prev => prev + 1);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        username: profile.username,
        phone: profile.phone,
        currency: profile.currency,
        theme: profile.theme,
        ai_provider: profile.ai_provider,
        gemini_api_key: profile.gemini_api_key,
        claude_api_key: profile.claude_api_key,
        openai_api_key: profile.openai_api_key,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      alert('Configurações atualizadas com sucesso!');
      setPreferences({
        currency: profile.currency,
        theme: profile.theme,
        phone: profile.phone
      });
      setRefresh(prev => prev + 1);
    } else {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar configurações: ' + error.message);
    }
    setSaving(false);
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stats: {
            netProfit: 100,
            winRate: 50,
            total: 2,
            wins: 1,
            losses: 1,
            profitFactor: 1.5,
            disciplinePercentage: 90,
            bestAssets: ['EURUSD'],
            bestEntryHours: ['10:00'],
            triggerStats: {}
          },
          userId: user.id 
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert('Conexão com IA realizada com sucesso!');
    } catch (error: any) {
      alert('Falha na conexão: ' + error.message);
    } finally {
      setTestingAI(false);
    }
  };

  const handleAddTrigger = async () => {
    if (!newTrigger.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('triggers')
      .insert({
        user_id: user.id,
        name: newTrigger.trim()
      });

    if (!error) {
      setNewTrigger('');
      setRefresh(prev => prev + 1);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    const { error } = await supabase
      .from('triggers')
      .delete()
      .eq('id', id);

    if (!error) {
      setRefresh(prev => prev + 1);
    } else {
      console.error('Erro ao deletar gatilho:', error);
      alert('Erro ao deletar gatilho: ' + error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As novas senhas não coincidem!');
      return;
    }
    setPasswordSaving(true);
    
    // Supabase password update
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      alert('Erro ao atualizar senha: ' + error.message);
    } else {
      alert('Senha atualizada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setPasswordSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">CONFIGURAÇÕES DO SISTEMA</h1>
        <p className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-widest">Gerencie seu perfil, gatilhos operacionais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {[
            { id: 'profile', label: 'MEU PERFIL', icon: User },
            { id: 'triggers', label: 'GATILHOS', icon: Zap },
            { id: 'ai', label: 'IA CONFIG', icon: Brain },
            { id: 'security', label: 'SEGURANÇA', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          
          <div className="pt-0 lg:pt-8 flex-shrink-0 lg:w-full">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">SAIR DA CONTA</span>
              <span className="lg:hidden">SAIR</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">INFORMAÇÕES PESSOAIS</h3>
              </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center relative">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-700" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label 
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-lg text-white shadow-lg border border-blue-500 hover:bg-blue-500 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    disabled
                    value={profile?.email || ''}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                    <input 
                      type="text" 
                      value={profile?.username || ''}
                      onChange={(e) => setProfile({...profile, username: e.target.value})}
                      className="w-full bg-[#050A15] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>

            {/* App Preferences moved back here */}
            <div className="pt-8 border-t border-slate-800 space-y-8">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-slate-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">PREFERÊNCIAS DO APP</h3>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">MOEDA DO SISTEMA</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Escolha a moeda para exibição de valores</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                  {['BRL', 'USD', 'USDT'].map((curr) => (
                    <button 
                      key={curr}
                      onClick={() => setProfile({...profile, currency: curr})}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${profile.currency === curr ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">TEMA DO SISTEMA</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Escolha a aparência da interface</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                  <button 
                    onClick={() => {
                      console.log('Mudando tema para dark');
                      setProfile({...profile, theme: 'dark'});
                    }}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${profile.theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                  >DARK</button>
                  <button 
                    onClick={() => {
                      console.log('Mudando tema para light');
                      setProfile({...profile, theme: 'light'});
                    }}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${profile.theme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                  >LIGHT</button>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-8">
              {/* Trigger Management */}
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">MEUS GATILHOS PERSONALIZADOS</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input 
                      type="text" 
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      placeholder="Novo gatilho..."
                      className="flex-1 bg-[#050A15] border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleAddTrigger}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      <Plus className="w-3 h-3" /> ADICIONAR
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Defina seus próprios gatilhos operacionais. Eles estarão disponíveis para seleção em suas operações.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {triggers.map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-tight">{trigger.name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTrigger(trigger.id)}
                        className="p-2 text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {triggers.length === 0 && (
                    <div className="col-span-full py-8 text-center border border-dashed border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Nenhum gatilho personalizado cadastrado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Standard Triggers */}
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">GATILHOS PADRÃO DO SISTEMA</h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Estes são gatilhos pré-definidos que estão sempre disponíveis para uso.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STANDARD_TRIGGERS.map((trigger, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-[#050A15]/50 border border-slate-800/50 rounded-xl">
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">{trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">INTELIGÊNCIA ARTIFICIAL</h3>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <p className="text-xs text-purple-200 leading-relaxed">
                    Personalize sua experiência de análise. Você pode usar sua própria chave de API para garantir maior velocidade e autonomia nos insights gerados pela IA. Se deixado em branco, o sistema tentará usar a chave global configurada.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Provedor de IA Ativo</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'gemini', label: 'Google Gemini', icon: Cpu },
                        { id: 'claude', label: 'Anthropic Claude', icon: Cpu },
                        { id: 'openai', label: 'OpenAI GPT', icon: Cpu }
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => setProfile({...profile, ai_provider: prov.id})}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${profile.ai_provider === prov.id ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10' : 'bg-[#050A15] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                        >
                          <prov.icon className={`w-4 h-4 ${profile.ai_provider === prov.id ? 'text-purple-400' : 'text-slate-600'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-tight">{prov.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {profile.ai_provider === 'gemini' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gemini API Key</label>
                        <input 
                          type="password" 
                          placeholder="Cole sua chave do Google Gemini aqui..."
                          value={profile.gemini_api_key}
                          onChange={(e) => setProfile({...profile, gemini_api_key: e.target.value})}
                          className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    )}

                    {profile.ai_provider === 'claude' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Claude API Key</label>
                        <input 
                          type="password" 
                          placeholder="Cole sua chave da Anthropic Claude aqui..."
                          value={profile.claude_api_key}
                          onChange={(e) => setProfile({...profile, claude_api_key: e.target.value})}
                          className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    )}

                    {profile.ai_provider === 'openai' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OpenAI API Key</label>
                        <input 
                          type="password" 
                          placeholder="Cole sua chave da OpenAI aqui..."
                          value={profile.openai_api_key}
                          onChange={(e) => setProfile({...profile, openai_api_key: e.target.value})}
                          className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={handleTestAI}
                    disabled={testingAI}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-lg"
                  >
                    {testingAI ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    {testingAI ? 'TESTANDO...' : 'TESTAR CONEXÃO'}
                  </button>

                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-600/20"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES DE IA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">SEGURANÇA DA CONTA</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha Atual</label>
                  <input 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nova Senha</label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirmar Senha</label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={passwordSaving}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {passwordSaving ? 'ATUALIZANDO...' : 'ATUALIZAR SEGURANÇA'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
