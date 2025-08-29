const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json());

// Simple API endpoints (without problematic paths)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/ai', async (req, res) => {
  try {
    const { message } = req.body;
    res.json({
      response: `I understand you said: "${message}". I'm here to help and support you.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

app.get('/api/wellness', (req, res) => {
  res.json({
    videos: [
      {
        id: '1',
        title: 'Mindfulness Meditation',
        duration: '10 min',
        category: 'meditation'
      },
      {
        id: '2',
        title: 'Breathing Exercises',
        duration: '5 min',
        category: 'breathing'
      }
    ]
  });
});

// Serve static files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Helper function to get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔════════════════════════════════════════════╗
║     🚀 AstralCore Server Running!          ║
╠════════════════════════════════════════════╣
║                                            ║
║  Access your site at:                      ║
║  ➤ Local:    http://localhost:${PORT}        ║
║  ➤ Network:  http://${localIP}:${PORT}   ║
║                                            ║
║  API Key:    ${process.env.VITE_GOOGLE_API_KEY ? '✅ Configured' : '⚠️  Not set'}         ║
║                                            ║
║  Press Ctrl+C to stop                      ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📍 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});