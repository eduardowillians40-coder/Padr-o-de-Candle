'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';

type UserPreferences = {
  currency: 'BRL' | 'USD' | 'USDT';
  theme: 'dark' | 'light';
  phone: string;
};

const UserPreferencesContext = createContext<{
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  loading: boolean;
} | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'BRL',
    theme: 'dark',
    phone: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('currency, theme, phone')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setPreferences({
          currency: profile.currency || 'BRL',
          theme: profile.theme || 'dark',
          phone: profile.phone || ''
        });
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [supabase]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, setPreferences, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  return context;
};
