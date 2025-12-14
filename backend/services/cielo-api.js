const axios = require('axios');
const { insertWalletData } = require('./database');

const CIELO_BASE = process.env.CIELO_API_BASE || 'http://65.109.173.90:3001';

/**
 * Fetch wallet data from Cielo Finance API
 */
async function fetch(walletAddress, timeframe = '7d') {
  const url = `${CIELO_BASE}/scrape/${walletAddress}/${timeframe}`;
  
  try {
    console.log(`📡 Fetching Cielo data for ${walletAddress} (${timeframe})...`);
    
    const response = await axios.get(url, {
      timeout: 60000
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Cielo API error');
    }
    
    console.log(`✅ Cielo data received for ${walletAddress} - PnL: $${response.data.data.overview.total_pnl.toFixed(2)}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Cielo API error for ${walletAddress}:`, error.message);
    throw error;
  }
}

/**
 * Fetch wallet data from Cielo and save to SQLite database
 */
async function fetchAndSave(walletAddress) {
  const data = await fetch(walletAddress);
  
  console.log(`💾 Saving ${walletAddress} to database...`);
  insertWalletData(walletAddress, data);
  console.log(`✅ ${walletAddress} saved successfully`);
  
  return data;
}

module.exports = {
  fetch,
  fetchAndSave
};
