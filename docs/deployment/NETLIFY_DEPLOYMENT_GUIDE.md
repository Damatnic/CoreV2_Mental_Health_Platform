# Netlify Deployment Guide - CoreV2

## Build System Overview

This project uses a robust build system designed to handle various edge cases and ensure successful deployments on Netlify's Linux environment.

## Key Changes Made

### 1. Node.js Version
- **Changed from**: Node.js 22.12.0
- **Changed to**: Node.js 20.18.1
- **Reason**: Better compatibility with Vite and build tools on Linux

### 2. Dependencies Structure
- **Rollup**: Added as explicit dependency
- **Platform binaries**: Added as optional dependencies (auto-selected based on OS)
- **Build tools**: Moved critical tools to main dependencies

### 3. Build Scripts

#### Primary Build Script: `netlify-robust-build.js`
- Multiple fallback strategies
- Automatic dependency fixing
- Platform-specific handling
- Emergency build creation if all else fails

#### Available Build Commands:
```bash
# Primary (recommended for Netlify)
npm run build:netlify

# Alternative builds
npm run build                 # Uses robust build script
npm run build:full           # Direct Vite build
npm run build:production     # Optimized production build
```

## Deployment Configuration

### netlify.toml Settings:
```toml
[build]
  command = "node scripts/netlify-robust-build.js"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "20.18.1"
  NODE_OPTIONS = "--max-old-space-size=4096"
```

## Troubleshooting

### If Build Fails on Netlify:

1. **Check Node Version**
   - Ensure `NODE_VERSION = "20.18.1"` in netlify.toml
   - Verify .node-version and .nvmrc files match

2. **Clear Build Cache**
   - In Netlify dashboard: Deploys → Trigger Deploy → Clear cache and deploy site

3. **Dependency Issues**
   - The robust build script automatically handles most issues
   - If persistent, check Netlify build logs for specific errors

4. **Rollup Platform Errors**
   - These are handled as optional dependencies
   - Linux binaries are auto-installed during Netlify build

### Local Testing

Test the build locally to ensure it works:
```bash
# Clean install
node scripts/clean-install.js

# Test build
node scripts/test-build-locally.js

# Or test specific build
npm run build:netlify
```

## Build Features

### Automatic Fixes:
- Missing dependencies detection and installation
- Package.json validation and repair
- Platform-specific binary selection
- Cache clearing when needed

### Fallback Strategies:
1. Standard Vite production build
2. Vite build without minification
3. Basic Vite build
4. Emergency static build (last resort)

### Build Verification:
- Checks for dist directory
- Validates index.html presence
- Ensures assets are generated
- Reports file count and build time

## Performance Optimizations

The build includes:
- Code splitting for optimal chunk sizes
- Legacy browser support
- Compression (gzip and brotli)
- Tree shaking and dead code elimination
- Service worker generation

## Environment Support

### Supported Platforms:
- Linux (x64, arm64) - Netlify's environment
- macOS (x64, arm64)
- Windows (x64)

### Node.js Versions:
- Recommended: 20.9.0 - 20.x
- Supported: 20.9.0+
- Not recommended: 22.x (may have compatibility issues)

## Monitoring Deployment

After pushing changes:
1. Check Netlify dashboard for build status
2. Review build logs if deployment fails
3. Verify site functionality after successful deploy

## Emergency Procedures

If standard build fails:
1. The robust script creates emergency build automatically
2. This ensures at least a basic site deploys
3. Check logs to identify root cause
4. File issue if problem persists

## Contact for Issues

If deployment issues persist after following this guide:
1. Check build logs in Netlify dashboard
2. Review recent commits for potential issues
3. Test build locally with exact Node version
4. Clear Netlify cache and retry

---

Last Updated: 2025-08-14
Build System Version: 2.0.0
Status: Stable and tested