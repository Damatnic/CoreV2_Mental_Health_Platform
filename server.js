const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle CSP in the HTML
  crossOriginEmbedderPolicy: false
}));

// Enable CORS
app.use(cors());

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - Mock implementations of Netlify functions
app.get('/.netlify/functions/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/.netlify/functions/ai', async (req, res) => {
  try {
    // Simple mock response for now
    // In production, this would call Google AI API with your key
    const { message } = req.body;
    
    res.json({
      response: `I understand you said: "${message}". I'm here to help and support you.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

app.get('/.netlify/functions/wellness', (req, res) => {
  // Mock wellness data
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

// Serve static files from dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle React routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
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
  return 'YOUR_IP';
}

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔════════════════════════════════════════════╗
║     🚀 AstralCore Server Running!          ║
╠════════════════════════════════════════════╣
║                                            ║
║  HTTP Server:                              ║
║  ➤ Local:    http://localhost:${PORT}        ${PORT < 1000 ? ' ' : ''}║
║  ➤ Network:  http://${localIP}:${PORT}   ║
║                                            ║
║  Status:     ✅ Online                     ║
║  Environment: Production                   ║
║  API Key:    ${process.env.VITE_GOOGLE_API_KEY ? '✅ Configured' : '⚠️  Not set'}         ║
║                                            ║
║  Press Ctrl+C to stop                      ║
╚════════════════════════════════════════════╝
  `);
});

// Optional: HTTPS support (requires certificates)
if (fs.existsSync('server.key') && fs.existsSync('server.cert')) {
  const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  };
  
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════╗
║  HTTPS Server:                             ║
║  ➤ Local:    https://localhost:${HTTPS_PORT}      ║
║  ➤ Network:  https://${getLocalIP()}:${HTTPS_PORT}║
╚════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('\n📍 Shutting down server gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}