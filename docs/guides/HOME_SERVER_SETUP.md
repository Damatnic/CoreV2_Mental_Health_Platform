# 🏠 AstralCore Home Server Setup Guide

## 🚀 Quick Start (Windows)

### Option 1: Simple Start
Double-click `start-server.bat` or run:
```bash
start-server.bat
```
Your site will be available at: **http://localhost:3000**

### Option 2: Using PM2 (Recommended for 24/7 hosting)
```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start ecosystem.config.js

# View logs
pm2 logs astralcore

# Stop server
pm2 stop astralcore

# Restart server
pm2 restart astralcore
```

## 📱 Access Your Server

### From Your Computer
- **Local URL**: http://localhost:3000

### From Other Devices on Your Network
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Access from any device on your network:
   - **Network URL**: http://YOUR_IP:3000
   - Example: http://192.168.1.100:3000

### From the Internet (Advanced)
To make your server accessible from outside your home network:

1. **Port Forwarding** (on your router):
   - Forward external port 80 to internal port 3000
   - Forward to your computer's IP address

2. **Dynamic DNS** (optional):
   - Use a service like No-IP or DuckDNS
   - Get a free domain name that points to your home IP

3. **Security Considerations**:
   - Use HTTPS (see SSL setup below)
   - Configure firewall rules
   - Keep server updated
   - Monitor access logs

## 🔒 SSL/HTTPS Setup (Optional)

### Self-Signed Certificate (for testing)
```bash
# Generate certificate
openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365

# Server will automatically use these if present
```

### Let's Encrypt (for real certificates)
```bash
# Install certbot
# Follow Let's Encrypt guides for your system
```

## 🛠️ Configuration

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your desired port
```

### Environment Variables
Edit `.env.production`:
```env
PORT=3000
VITE_GOOGLE_API_KEY=your_api_key_here
NODE_ENV=production
```

## 📊 Server Management

### View Server Status
```bash
# If using PM2
pm2 status

# View detailed info
pm2 info astralcore
```

### Monitor Resources
```bash
# Real-time monitoring
pm2 monit
```

### Auto-Start on Boot (Windows)
```bash
# Save PM2 configuration
pm2 save

# Install PM2 startup script
pm2 startup
```

### View Logs
```bash
# PM2 logs
pm2 logs astralcore --lines 100

# Or check log files
type logs\out.log
type logs\err.log
```

## 🔧 Troubleshooting

### Port Already in Use
Change the port in `server.js` or stop the conflicting service:
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Can't Access from Other Devices
1. Check Windows Firewall:
   - Allow Node.js through firewall
   - Allow port 3000

2. Check your IP:
   ```bash
   ipconfig
   ```

3. Ensure devices are on same network

### Server Crashes
1. Check logs for errors
2. Ensure all dependencies installed:
   ```bash
   npm install
   ```
3. Rebuild if needed:
   ```bash
   npm run build
   ```

## 🌟 Features

Your home server includes:
- ✅ Full AstralCore application
- ✅ API endpoints (adapted from Netlify functions)
- ✅ Static file serving with compression
- ✅ Security headers (Helmet.js)
- ✅ CORS support
- ✅ Automatic HTTPS (if certificates present)
- ✅ Production optimizations
- ✅ Graceful shutdown handling

## 📝 Advanced Configuration

### Nginx Reverse Proxy
If you want to use Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t astralcore .
docker run -p 3000:3000 astralcore
```

## 🎉 You're All Set!

Your AstralCore server is ready to run from your home!

**Need help?** Check the logs or restart the server.
**Want 24/7 hosting?** Use PM2 with auto-startup.