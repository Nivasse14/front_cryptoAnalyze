import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface WalletFilters {
  timeframe?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface WalletStats {
  id: number;
  wallet_address: string;
  timeframe: string;
  status: string;
  total_pnl: number;
  total_roi_percentage: number;
  winrate: number;
  swap_count: number;
  unique_trading_days: number;
  winning_trades: number;
  losing_trades: number;
  profitable_tokens: number;
  losing_tokens: number;
  breakeven_tokens: number;
  total_tokens_traded: number;
  max_win_streak: number;
  max_loss_streak: number;
  average_holding_time_minutes: number;
  total_invest: number;
  total_withdraw: number;
  net_profit: number;
  best_trade_token: string;
  best_trade_profit: number;
  worst_trade_token: string;
  worst_trade_loss: number;
  avg_profit_per_win: number;
  avg_loss_per_loss: number;
  roi_above_500: number;
  roi_200_to_500: number;
  roi_50_to_200: number;
  roi_10_to_50: number;
  roi_0_to_10: number;
  hold_0_3_min: number;
  hold_3_30_min: number;
  hold_30_60_min: number;
  hold_1_24_hours: number;
  hold_gt_24_hours: number;
  scraped_at: string;
}

export interface WalletsResponse {
  timeframe: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  results: WalletStats[];
}

export interface LeaderboardResponse {
  timeframe: string;
  count: number;
  results: Partial<WalletStats>[];
}

export interface QueryFilter {
  field: string;
  op: '>' | '>=' | '<' | '<=' | '=' | '!=' | 'in' | 'between' | 'like';
  value: any;
}

export interface QueryRequest {
  timeframe?: string;
  filters?: QueryFilter[];
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface WalletDetail {
  wallet_address: string;
  timeframes: WalletStats[];
  top_tokens: any[];
  worst_tokens: any[];
  peak_hours: any[];
  dex_breakdown: any[];
  wins_distribution: any[];
}

export const api = {
  // Wallets - Nouvelle API paginée
  getWallets: (filters: WalletFilters = {}) => 
    axios.get<WalletsResponse>(`${API_BASE}/wallets`, { params: filters }),
  
  // Wallet individuel via query filter
  getWallet: (address: string, timeframe = '7d') => 
    axios.post<{ count: number; results: WalletStats[] }>(`${API_BASE}/query`, {
      timeframe,
      filters: [{ field: 'wallet_address', op: '=', value: address }],
      limit: 1
    }),
  
  // Tous les timeframes d'un wallet
  getWalletAllTimeframes: (address: string) => 
    axios.post<{ count: number; results: WalletStats[] }>(`${API_BASE}/query`, {
      filters: [{ field: 'wallet_address', op: '=', value: address }],
      limit: 10
    }),
  
  // Leaderboard simplifié
  getLeaderboard: (params: { timeframe?: string; limit?: number; orderBy?: string; orderDir?: 'ASC' | 'DESC' } = {}) => 
    axios.get<LeaderboardResponse>(`${API_BASE}/leaderboard`, { params }),
  
  // Query avancée avec filtres
  queryWallets: (request: QueryRequest) => 
    axios.post<{ count: number; results: WalletStats[] }>(`${API_BASE}/query`, request),
  
  // Health check
  health: () => 
    axios.get<{ status: string; service: string }>(`${API_BASE}/health`)
};
