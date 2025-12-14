require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

// API Analytics distante
const ANALYTICS_API = process.env.ANALYTICS_API_BASE || 'http://[2a01:4f9:c013:b2c4::1]:4000/api';

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'proxy',
    upstream: ANALYTICS_API,
    timestamp: new Date().toISOString() 
  });
});

// Proxy vers l'API Analytics distante
app.use('/api', async (req, res) => {
  try {
    const url = `${ANALYTICS_API}${req.path}`;
    console.log(`📡 Proxying ${req.method} ${url}`);
    
    const config = {
      method: req.method,
      url,
      params: req.query,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      family: 6 // Force IPv6
    };

    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Analytics Proxy running on port ${PORT}`);
  console.log(`📡 Upstream API: ${ANALYTICS_API}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
});
