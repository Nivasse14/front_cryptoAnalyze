const axios = require('axios');

const GMGN_BASE = process.env.GMGN_API_BASE || 'http://[2a01:4f9:c013:b2c4::1]:3000';

/**
 * Fetch wallet data from GMGN API
 * @param {string} walletAddress - Solana wallet address
 * @param {string} timeframe - '7d' or '30d'
 */
async function fetch(walletAddress, timeframe = '7d') {
  if (!['7d', '30d'].includes(timeframe)) {
    throw new Error('GMGN timeframe must be 7d or 30d');
  }

  const url = `${GMGN_BASE}/scrape/${walletAddress}/${timeframe}`;
  
  try {
    console.log(`📡 Fetching GMGN data for ${walletAddress} (${timeframe})...`);
    console.log(`⚠️  Warning: GMGN API is slow (~40s per request)`);
    
    const response = await axios.get(url, {
      timeout: 60000, // 60s timeout (API is slow)
      family: 6 // Force IPv6
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'GMGN API error');
    }
    
    console.log(`✅ GMGN data received for ${walletAddress}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ GMGN API error for ${walletAddress}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetch
};
