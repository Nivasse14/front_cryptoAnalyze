const express = require('express');
const router = express.Router();
const cieloAPI = require('../services/cielo-api');
const { statements } = require('../services/database');

/**
 * POST /api/scraper/add - Ajouter un wallet et le scraper
 */
router.post('/add', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Check if wallet already exists
    const exists = statements.walletExists.get(walletAddress);
    
    if (exists) {
      return res.json({ 
        success: true, 
        message: 'Wallet already exists in database',
        action: 'use_refresh_endpoint',
        wallet: walletAddress 
      });
    }
    
    // Scrape via Cielo API
    const data = await cieloAPI.fetchAndSave(walletAddress);
    
    res.json({ 
      success: true, 
      message: 'Wallet added and scraped successfully',
      wallet: walletAddress,
      data 
    });
    
  } catch (error) {
    console.error('Error adding wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scraper/refresh/:address - Rafraîchir un wallet existant
 */
router.post('/refresh/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log(`🔄 Refreshing wallet ${address}...`);
    const data = await cieloAPI.fetchAndSave(address);
    
    res.json({ 
      success: true, 
      message: 'Wallet refreshed successfully',
      wallet: address,
      data 
    });
  } catch (error) {
    console.error('Error refreshing wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scraper/batch - Scraper plusieurs wallets
 */
router.post('/batch', async (req, res) => {
  try {
    const { wallets } = req.body;
    
    if (!Array.isArray(wallets)) {
      return res.status(400).json({ error: 'wallets must be an array' });
    }
    
    if (wallets.length === 0) {
      return res.status(400).json({ error: 'wallets array cannot be empty' });
    }
    
    if (wallets.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 wallets per batch' });
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📦 Batch scraping job ${jobId} started for ${wallets.length} wallets`);
    
    // Process in background (don't block response)
    setImmediate(async () => {
      let successful = 0;
      let failed = 0;
      
      for (const wallet of wallets) {
        try {
          await cieloAPI.fetchAndSave(wallet);
          successful++;
          console.log(`✅ [${jobId}] ${wallet} scraped (${successful}/${wallets.length})`);
          
          // Rate limiting: 3s between requests
          if (successful < wallets.length) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          failed++;
          console.error(`❌ [${jobId}] Failed to scrape ${wallet}:`, error.message);
        }
      }
      
      console.log(`🏁 [${jobId}] Batch complete: ${successful} successful, ${failed} failed`);
    });
    
    res.json({ 
      success: true, 
      jobId,
      message: 'Batch scraping started',
      walletsCount: wallets.length,
      estimatedTime: `${Math.ceil(wallets.length * 3 / 60)} minutes`
    });
    
  } catch (error) {
    console.error('Error starting batch scrape:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scraping/start - Nouveau endpoint pour le scraping (compatible avec wallets-db.html)
 */
router.post('/start', async (req, res) => {
  try {
    const { source, mode, wallets } = req.body;
    
    // Validation
    if (!source || !['cielo', 'gmgn'].includes(source)) {
      return res.status(400).json({ error: 'source must be "cielo" or "gmgn"' });
    }
    
    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'wallets array is required' });
    }
    
    if (wallets.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 wallets per batch' });
    }
    
    // Generate PID (simulated)
    const pid = Math.floor(Math.random() * 90000) + 10000;
    
    console.log(`🚀 Scraping started - Source: ${source}, Mode: ${mode}, Wallets: ${wallets.length}, PID: ${pid}`);
    
    // Process in background
    setImmediate(async () => {
      let successful = 0;
      let failed = 0;
      
      for (const wallet of wallets) {
        try {
          if (source === 'cielo') {
            await cieloAPI.fetchAndSave(wallet, '7d');
            successful++;
            console.log(`✅ [PID ${pid}] Cielo: ${wallet} scraped (${successful}/${wallets.length})`);
            
            // Rate limiting: 3s between Cielo requests
            if (successful < wallets.length) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } else {
            // GMGN scraping (to be implemented)
            console.log(`⚠️ [PID ${pid}] GMGN scraping not yet implemented for ${wallet}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          failed++;
          console.error(`❌ [PID ${pid}] Failed to scrape ${wallet}:`, error.message);
        }
      }
      
      console.log(`🏁 [PID ${pid}] Scraping complete: ${successful} successful, ${failed} failed`);
    });
    
    const estimatedTime = source === 'cielo' 
      ? `${Math.ceil(wallets.length * 3 / 60)} minutes`
      : `${Math.ceil(wallets.length * 20 / 60)} minutes`;
    
    res.json({
      success: true,
      pid,
      message: `${source.toUpperCase()} scraping started`,
      walletsCount: wallets.length,
      estimatedTime
    });
    
  } catch (error) {
    console.error('Error starting scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
