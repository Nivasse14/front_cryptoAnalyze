const express = require('express');
const router = express.Router();
const { db, statements } = require('../services/database');

/**
 * GET /api/wallets - Liste de wallets avec filtres
 */
router.get('/', (req, res) => {
  try {
    const { 
      timeframe = '7d',
      minWinrate = 0,
      minROI = 0,
      minPNL = 0,
      maxSwaps = null,
      limit = 50,
      offset = 0,
      sortBy = 'total_pnl',
      sortOrder = 'DESC'
    } = req.query;

    // Build dynamic query with safe column name
    const validSortColumns = [
      'total_pnl', 'total_roi_percentage', 'winrate', 'swap_count', 
      'total_trades', 'winning_trades', 'scraped_at'
    ];
    
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'total_pnl';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT * FROM wallet_stats
      WHERE timeframe = ?
        AND winrate >= ?
        AND total_roi_percentage >= ?
        AND total_pnl >= ?
    `;
    
    const params = [timeframe, minWinrate, minROI, minPNL];
    
    if (maxSwaps) {
      query += ' AND swap_count <= ?';
      params.push(maxSwaps);
    }
    
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const wallets = db.prepare(query).all(...params);
    const totalCount = statements.countWalletsByTimeframe.get(timeframe).count;

    res.json({ 
      success: true,
      wallets, 
      pagination: { 
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount 
      } 
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallets/:address - Détail complet d'un wallet
 */
router.get('/:address', (req, res) => {
  try {
    const { address } = req.params;
    
    // Get all timeframes
    const timeframes = statements.getWalletDetails.all(address);
    
    if (timeframes.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get top tokens
    const topTokens = statements.getTopTokens.all(address, 'top');
    
    // Get worst tokens
    const worstTokens = statements.getTopTokens.all(address, 'worst');
    
    // Get peak hours (7d timeframe)
    const peakHours = statements.getPeakHours.all(address, '7d');
    
    // Get DEX breakdown (7d timeframe)
    const dexBreakdown = statements.getDexBreakdown.all(address, '7d');
    
    // Get wins distribution
    const winsDistribution = statements.getWinsDistribution.all(address, '7d');
    
    res.json({
      success: true,
      wallet_address: address,
      timeframes,
      top_tokens: topTokens,
      worst_tokens: worstTokens,
      peak_hours: peakHours,
      dex_breakdown: dexBreakdown,
      wins_distribution: winsDistribution
    });
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallets/:address/timeframes - Toutes les timeframes d'un wallet
 */
router.get('/:address/timeframes', (req, res) => {
  try {
    const { address } = req.params;
    const timeframes = statements.getWalletDetails.all(address);
    
    if (timeframes.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    res.json({ success: true, timeframes });
  } catch (error) {
    console.error('Error fetching timeframes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallets/:address/tokens - Top et worst tokens
 */
router.get('/:address/tokens', (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '7d' } = req.query;
    
    const topTokens = statements.getTopTokens.all(address, 'top');
    const worstTokens = statements.getTopTokens.all(address, 'worst');
    
    res.json({ 
      success: true,
      top_tokens: topTokens,
      worst_tokens: worstTokens
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallets/:address/hours - Peak trading hours
 */
router.get('/:address/hours', (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '7d' } = req.query;
    
    const peakHours = statements.getPeakHours.all(address, timeframe);
    
    res.json({ 
      success: true,
      peak_hours: peakHours
    });
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
