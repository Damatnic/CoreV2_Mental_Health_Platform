const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

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

// Create server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Handle API endpoints
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (pathname === '/api/wellness' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      videos: [
        { id: '1', title: 'Mindfulness Meditation', duration: '10 min', category: 'meditation' },
        { id: '2', title: 'Breathing Exercises', duration: '5 min', category: 'breathing' }
      ]
    }));
    return;
  }

  if (pathname === '/api/ai' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: `I understand you said: "${data.message}". I'm here to help and support you.`,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Handle Netlify function paths (redirect to /api)
  if (pathname.startsWith('/.netlify/functions/')) {
    const functionName = pathname.replace('/.netlify/functions/', '');
    res.writeHead(302, { 'Location': `/api/${functionName}` });
    res.end();
    return;
  }

  // Serve static files
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // For SPA routing, serve index.html for any route that doesn't match a file
      if (!path.extname(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    // Get file extension and content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // Try serving index.html for client-side routing
          fs.readFile(path.join(DIST_DIR, 'index.html'), (err, indexContent) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading application');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent);
            }
          });
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        // Set caching headers
        if (ext === '.js' || ext === '.css' || ext === '.png' || ext === '.jpg') {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        if (pathname === '/sw.js') {
          res.setHeader('Cache-Control', 'no-cache');
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔════════════════════════════════════════════╗
║     🏠 AstralCore Home Server              ║
╠════════════════════════════════════════════╣
║                                            ║
║  ✅ Server is running!                     ║
║                                            ║
║  Access your site at:                      ║
║  ➤ This PC:  http://localhost:${PORT}        ║
║  ➤ Network:  http://${localIP}:${PORT}   ║
║                                            ║
║  API Status: ✅ Ready                      ║
║  Google API: ${process.env.VITE_GOOGLE_API_KEY ? '✅ Configured' : '⚠️  Not configured'}         ║
║                                            ║
║  To stop: Press Ctrl+C                     ║
╚════════════════════════════════════════════╝
  `);

  // Open in browser (Windows)
  if (process.platform === 'win32') {
    require('child_process').exec(`start http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📍 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});