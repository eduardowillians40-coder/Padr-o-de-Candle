import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ConfigGuard from '@/components/ConfigGuard';
import { UserPreferencesProvider } from '@/app/context/UserPreferencesContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Padrão 3 Candles | Trading Journal',
  description: 'Seu diário de trade profissional para análise de performance e estratégias.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-[#050A15] text-slate-200 antialiased min-h-screen" suppressHydrationWarning>
        <UserPreferencesProvider>
          <ConfigGuard>
            {children}
          </ConfigGuard>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
