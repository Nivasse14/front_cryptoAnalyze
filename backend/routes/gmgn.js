const express = require('express');
const router = express.Router();
const gmgnAPI = require('../services/gmgn-api');

/**
 * GET /api/gmgn/:address/:timeframe - Données GMGN enrichies
 */
router.get('/:address/:timeframe', async (req, res) => {
  try {
    const { address, timeframe } = req.params;
    
    if (!['7d', '30d'].includes(timeframe)) {
      return res.status(400).json({ 
        error: 'Invalid timeframe. Must be 7d or 30d' 
      });
    }
    
    const data = await gmgnAPI.fetch(address, timeframe);
    
    res.json({ 
      success: true, 
      data 
    });
    
  } catch (error) {
    console.error('Error fetching GMGN data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
