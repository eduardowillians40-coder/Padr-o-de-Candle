-- SUPABASE SCHEMA FOR PADRÃO 3 CANDLES

-- 1. PROFILES TABLE
-- Stores additional user information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    email TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. WALLETS TABLE
-- Stores user trading accounts/wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    initial_balance DECIMAL(12,2) DEFAULT 0.00,
    meta_value DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own wallets" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" ON public.wallets
    FOR DELETE USING (auth.uid() = user_id);

-- 3. TRIGGERS TABLE
-- Stores user-defined trading triggers (psychological or technical)
CREATE TABLE IF NOT EXISTS public.triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.triggers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own triggers" ON public.triggers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own triggers" ON public.triggers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own triggers" ON public.triggers
    FOR DELETE USING (auth.uid() = user_id);

-- 4. TRADES TABLE
-- Stores trading operations
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    type TEXT CHECK (type IN ('BUY', 'SELL')) NOT NULL,
    entry_price DECIMAL(12,8) NOT NULL,
    exit_price DECIMAL(12,8) NOT NULL,
    quantity DECIMAL(12,8) NOT NULL,
    status TEXT CHECK (status IN ('WIN', 'LOSS', 'BE')) NOT NULL,
    strategy TEXT,
    trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,
    mental_state TEXT,
    notes TEXT,
    fees DECIMAL(12,2) DEFAULT 0.00,
    gross_profit DECIMAL(12,2) NOT NULL,
    net_profit DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- 5. AUTOMATIC PROFILE CREATION
-- Create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. STORAGE BUCKET (Optional - run in dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
