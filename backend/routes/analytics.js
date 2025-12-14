const express = require('express');
const router = express.Router();
const { db, statements } = require('../services/database');

/**
 * GET /api/analytics/top - Top performers
 */
router.get('/top', (req, res) => {
  try {
    const { timeframe = '7d', limit = 10 } = req.query;
    
    const topPerformers = statements.getTopPerformers.all(timeframe, parseInt(limit));
    
    res.json({
      success: true,
      timeframe,
      top_performers: topPerformers
    });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/leaderboard - Leaderboard complet
 */
router.get('/leaderboard', (req, res) => {
  try {
    const { timeframe = '7d', limit = 100 } = req.query;
    
    const leaderboard = statements.getLeaderboard.all(timeframe, parseInt(limit));
    
    // Calculate additional stats
    const stats = {
      total_wallets: leaderboard.length,
      avg_pnl: leaderboard.reduce((sum, w) => sum + (w.total_pnl || 0), 0) / leaderboard.length,
      avg_winrate: leaderboard.reduce((sum, w) => sum + (w.winrate || 0), 0) / leaderboard.length,
      total_trades: leaderboard.reduce((sum, w) => sum + (w.total_trades || 0), 0)
    };
    
    res.json({
      success: true,
      timeframe,
      stats,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/compare - Comparer plusieurs wallets
 */
router.post('/compare', (req, res) => {
  try {
    const { addresses, timeframe = '7d' } = req.body;
    
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'addresses must be a non-empty array' });
    }
    
    if (addresses.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 wallets for comparison' });
    }
    
    const placeholders = addresses.map(() => '?').join(',');
    const query = `
      SELECT * FROM wallet_stats 
      WHERE wallet_address IN (${placeholders}) 
        AND timeframe = ?
      ORDER BY total_pnl DESC
    `;
    
    const wallets = db.prepare(query).all(...addresses, timeframe);
    
    // Calculate comparison metrics
    const comparison = {
      wallets,
      summary: {
        best_pnl: Math.max(...wallets.map(w => w.total_pnl || 0)),
        worst_pnl: Math.min(...wallets.map(w => w.total_pnl || 0)),
        best_winrate: Math.max(...wallets.map(w => w.winrate || 0)),
        avg_winrate: wallets.reduce((sum, w) => sum + (w.winrate || 0), 0) / wallets.length,
        total_trades: wallets.reduce((sum, w) => sum + (w.total_trades || 0), 0)
      }
    };
    
    res.json({
      success: true,
      timeframe,
      comparison
    });
  } catch (error) {
    console.error('Error comparing wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/stats - Global statistics
 */
router.get('/stats', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const allWallets = statements.getWalletsByTimeframe.all(timeframe);
    
    const stats = {
      total_wallets: allWallets.length,
      total_pnl: allWallets.reduce((sum, w) => sum + (w.total_pnl || 0), 0),
      avg_pnl: allWallets.reduce((sum, w) => sum + (w.total_pnl || 0), 0) / allWallets.length,
      avg_winrate: allWallets.reduce((sum, w) => sum + (w.winrate || 0), 0) / allWallets.length,
      avg_roi: allWallets.reduce((sum, w) => sum + (w.total_roi_percentage || 0), 0) / allWallets.length,
      total_trades: allWallets.reduce((sum, w) => sum + (w.total_trades || 0), 0),
      profitable_wallets: allWallets.filter(w => w.total_pnl > 0).length,
      losing_wallets: allWallets.filter(w => w.total_pnl < 0).length
    };
    
    res.json({
      success: true,
      timeframe,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
