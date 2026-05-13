export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  initial_balance: number;
  meta_value: number;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  wallet_id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number;
  quantity: number;
  status: 'WIN' | 'LOSS' | 'BE';
  strategy: string | null;
  trigger_id: string | null;
  mental_state: string | null;
  notes: string | null;
  fees: number;
  gross_profit: number;
  net_profit: number;
  created_at: string;
};

export type Trigger = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};
