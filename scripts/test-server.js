#!/usr/bin/env node

/**
 * Simple HTTP server to test the build locally
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const distPath = path.join(projectRoot, 'dist');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
};

// Create server
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Parse URL
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // For SPA, serve index.html for all routes
      if (!path.extname(filePath)) {
        filePath = path.join(distPath, 'index.html');
      } else {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.message}`);
        return;
      }
      
      // Get MIME type
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Set headers
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      });
      
      res.end(content);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('   LOCAL TEST SERVER');
  console.log('========================================\n');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${distPath}`);
  console.log('\nPress Ctrl+C to stop the server\n');
  
  // Check if dist exists
  if (!fs.existsSync(distPath)) {
    console.error('\n[ERROR] dist/ directory not found!');
    console.error('Run "npm run build" first\n');
    process.exit(1);
  }
  
  // List files in dist
  const files = fs.readdirSync(distPath);
  console.log(`\nFound ${files.length} files in dist/:`);
  files.slice(0, 10).forEach(f => console.log(`  - ${f}`));
  if (files.length > 10) {
    console.log(`  ... and ${files.length - 10} more`);
  }
  console.log('\n');
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use`);
    console.error('Try stopping other servers or use a different port\n');
  } else {
    console.error('\n[ERROR] Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server stopped\n');
    process.exit(0);
  });
});