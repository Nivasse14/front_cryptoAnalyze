const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/wallets.db');
let db;

try {
  db = new Database(dbPath, { readonly: false });
  console.log(`✅ Connected to database: ${dbPath}`);
} catch (error) {
  console.error(`❌ Database connection error: ${error.message}`);
  process.exit(1);
}

// Prepared statements for common queries
const statements = {
  // Wallet queries
  getWallets: db.prepare(`
    SELECT * FROM wallet_stats
    WHERE timeframe = ?
      AND winrate >= ?
      AND total_roi_percentage >= ?
      AND total_pnl >= ?
    ORDER BY ?? DESC
    LIMIT ? OFFSET ?
  `),
  
  getWalletsByTimeframe: db.prepare(`
    SELECT * FROM wallet_stats WHERE timeframe = ?
  `),
  
  getWalletDetails: db.prepare(`
    SELECT * FROM wallet_stats WHERE wallet_address = ?
  `),
  
  getTopTokens: db.prepare(`
    SELECT * FROM top_tokens WHERE wallet_address = ? AND type = ?
  `),
  
  getPeakHours: db.prepare(`
    SELECT * FROM peak_hours WHERE wallet_address = ? AND timeframe = ?
  `),
  
  getDexBreakdown: db.prepare(`
    SELECT * FROM dex_breakdown WHERE wallet_address = ? AND timeframe = ?
  `),
  
  getWinsDistribution: db.prepare(`
    SELECT * FROM wins_distribution WHERE wallet_address = ? AND timeframe = ?
  `),
  
  // Analytics queries
  getTopPerformers: db.prepare(`
    SELECT * FROM wallet_stats 
    WHERE timeframe = ? 
    ORDER BY total_pnl DESC 
    LIMIT ?
  `),
  
  getLeaderboard: db.prepare(`
    SELECT 
      wallet_address,
      total_pnl,
      total_roi_percentage,
      winrate,
      swap_count,
      total_trades,
      profitable_tokens,
      most_traded_token_symbol,
      scraped_at
    FROM wallet_stats
    WHERE timeframe = ?
    ORDER BY total_pnl DESC
    LIMIT ?
  `),
  
  countWalletsByTimeframe: db.prepare(`
    SELECT COUNT(*) as count FROM wallet_stats WHERE timeframe = ?
  `),
  
  walletExists: db.prepare(`
    SELECT 1 FROM wallet_stats WHERE wallet_address = ? LIMIT 1
  `)
};

/**
 * Insert wallet data from Cielo API response
 */
function insertWalletData(walletAddress, cieloData) {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO wallet_stats (
      wallet_address, timeframe,
      total_pnl, total_roi_percentage, winrate, swap_count,
      unique_trading_days, consecutive_trading_days, average_holding_time_minutes,
      total_trades, winning_trades, losing_trades, win_rate,
      average_trades_per_token, max_win_streak, max_losing_streak,
      hold_0_3_min, hold_3_20_min, hold_20_60_min, hold_1_6_hours, hold_6_24_hours, hold_gt_24_hours, total_tokens_held,
      roi_above_500, roi_200_to_500, roi_50_to_200, roi_0_to_50, roi_neg50_to_0, roi_below_neg50,
      total_buy_count, total_buy_amount_usd, average_buy_amount_usd, minimum_buy_amount_usd, maximum_buy_amount_usd,
      total_sell_count, total_sell_amount_usd, average_sell_amount_usd, minimum_sell_amount_usd, maximum_sell_amount_usd,
      profitable_tokens, losing_tokens, total_tokens_traded, win_rate_tokens,
      best_trade_token, best_trade_profit, worst_trade_token, worst_trade_loss,
      most_traded_token_address, most_traded_token_name, most_traded_token_symbol, most_traded_token_pnl, most_traded_token_roi,
      dex_total_trades, dex_primary_name, dex_primary_percent,
      first_swap_timestamp, last_swap_timestamp, scraped_at, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertTopTokens = db.prepare(`
    INSERT OR REPLACE INTO top_tokens (
      wallet_address, timeframe, type, rank, token_address, token_name, token_symbol, pnl, roi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPeakHours = db.prepare(`
    INSERT OR REPLACE INTO peak_hours (wallet_address, timeframe, hour, trade_count)
    VALUES (?, ?, ?, ?)
  `);

  const insertDexBreakdown = db.prepare(`
    INSERT OR REPLACE INTO dex_breakdown (wallet_address, timeframe, dex_name, trade_count, percentage)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((walletAddress, timeframes) => {
    for (const [timeframe, data] of Object.entries(timeframes)) {
      const overview = data.overview || {};
      const trading = data.trading_stats || {};
      const holding = data.holding_time_distribution || {};
      const roi = data.roi_distribution || {};
      const buy = data.buy_stats || {};
      const sell = data.sell_stats || {};
      const tokenDist = data.token_profit_distribution || {};
      const best = data.best_trade || {};
      const worst = data.worst_trade || {};
      const mostTraded = data.most_traded_token || {};
      const dex = data.dex_stats || {};

      // Insert wallet stats
      insertStmt.run(
        walletAddress, timeframe,
        overview.total_pnl || 0, overview.total_roi_percentage || 0, overview.winrate || 0, overview.swap_count || 0,
        trading.unique_trading_days || 0, trading.consecutive_trading_days || 0, holding.average_holding_time_minutes || 0,
        trading.total_trades || 0, trading.winning_trades || 0, trading.losing_trades || 0, trading.win_rate || 0,
        trading.average_trades_per_token || 0, trading.max_win_streak || 0, trading.max_losing_streak || 0,
        holding.hold_0_3_min || 0, holding.hold_3_20_min || 0, holding.hold_20_60_min || 0, 
        holding.hold_1_6_hours || 0, holding.hold_6_24_hours || 0, holding.hold_gt_24_hours || 0, holding.total_tokens_held || 0,
        roi.roi_above_500 || 0, roi.roi_200_to_500 || 0, roi.roi_50_to_200 || 0, 
        roi.roi_0_to_50 || 0, roi.roi_neg50_to_0 || 0, roi.roi_below_neg50 || 0,
        buy.total_buy_count || 0, buy.total_buy_amount_usd || 0, buy.average_buy_amount_usd || 0, 
        buy.minimum_buy_amount_usd || 0, buy.maximum_buy_amount_usd || 0,
        sell.total_sell_count || 0, sell.total_sell_amount_usd || 0, sell.average_sell_amount_usd || 0, 
        sell.minimum_sell_amount_usd || 0, sell.maximum_sell_amount_usd || 0,
        tokenDist.profitable_tokens || 0, tokenDist.losing_tokens || 0, tokenDist.total_tokens_traded || 0, tokenDist.win_rate_tokens || 0,
        best.token || null, best.profit || 0, worst.token || null, worst.loss || 0,
        mostTraded.address || null, mostTraded.name || null, mostTraded.symbol || null, 
        mostTraded.pnl || 0, mostTraded.roi || 0,
        dex.total_trades || 0, dex.dexes?.[0]?.name || null, dex.dexes?.[0]?.percent || 0,
        data.first_swap_timestamp || null, data.last_swap_timestamp || null, Date.now(), 'success'
      );

      // Insert top performing tokens
      if (data.top_performing_tokens) {
        data.top_performing_tokens.forEach((token, index) => {
          insertTopTokens.run(
            walletAddress, timeframe, 'top', index + 1,
            token.address, token.name, token.symbol, token.pnl, token.roi || 0
          );
        });
      }

      // Insert worst performing tokens
      if (data.worst_performing_tokens) {
        data.worst_performing_tokens.forEach((token, index) => {
          insertTopTokens.run(
            walletAddress, timeframe, 'worst', index + 1,
            token.address, token.name, token.symbol, token.pnl, token.roi || 0
          );
        });
      }

      // Insert peak hours
      if (data.peak_trading_hours) {
        data.peak_trading_hours.forEach(hour => {
          insertPeakHours.run(walletAddress, timeframe, hour.hour, hour.count);
        });
      }

      // Insert DEX breakdown
      if (dex.dexes) {
        dex.dexes.forEach(d => {
          insertDexBreakdown.run(walletAddress, timeframe, d.name, d.trades, d.percent);
        });
      }
    }
  });

  transaction(walletAddress, cieloData.timeframes);
}

module.exports = {
  db,
  statements,
  insertWalletData
};
