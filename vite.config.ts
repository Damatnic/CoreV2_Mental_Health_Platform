import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
// import { VitePWA } from 'vite-plugin-pwa';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports for optional plugins
let legacy: any;
let sentryPlugin: any;

// Import Sentry plugin for production builds
if (process.env.NODE_ENV === 'production' && process.env.VITE_SENTRY_DSN) {
  try {
    sentryPlugin = await import('@sentry/vite-plugin').then(m => m.sentryVitePlugin);
  } catch (e) {
    console.warn('Sentry plugin not available');
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    base: '/', // Ensure correct base path for Netlify
    plugins: [
      react(),
      // Compression plugins for production
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      // Legacy browser support (only if available)
      legacy && null /* legacy plugin disabled */,
      // Bundle visualizer (only in analyze mode)
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      // Sentry plugin for production source map upload
      isProduction && sentryPlugin && sentryPlugin({
        org: process.env.SENTRY_ORG || 'astral-core',
        project: process.env.SENTRY_PROJECT || 'mental-health-platform',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          assets: './dist/**',
          ignore: ['node_modules/**'],
        },
      }),
    ].filter(Boolean),
    publicDir: 'public',
    resolve: {
      alias: {
        buffer: 'buffer',
        stream: 'stream-browserify',
        util: 'util',
        // Add explicit resolution for services to ensure cross-platform compatibility
        '@services': path.resolve(__dirname, './src/services')
      },
      // Ensure proper extension resolution for TypeScript files
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? 'hidden' : true, // Hidden sourcemaps in production for Sentry
      assetsInlineLimit: 4096, // Inline small assets
      cssCodeSplit: true, // Split CSS for better caching
      manifest: true, // Generate manifest for PWA
      minify: isProduction ? 'terser' : false, // Aggressive minification with terser
      target: isProduction ? ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'] : 'es2015', // Optimized browser targets
      chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
      reportCompressedSize: false, // Speed up build by not reporting compressed size
      rollupOptions: {
        plugins: [
          // Ensure proper module resolution
          nodeResolve({
            preferBuiltins: false,
            browser: true
          })
        ],
        // External dependencies for server-side modules
        external: (id) => {
          // Exclude video files from bundling
          if (/\.(mp4|webm|mov|avi)$/.test(id)) {
            return true;
          }
          // Exclude server-side dependencies that shouldn't be bundled
          const serverDeps = [
            'pg',
            'pg-protocol',
            'jsonwebtoken',
            'bcryptjs',
            '@neondatabase/serverless',
            'drizzle-orm',
            'openai',
            '@anthropic-ai/sdk'
          ];
          return serverDeps.some(dep => id.includes(dep));
        },
        output: {
          // Optimize chunk sizes for mobile
          manualChunks: (id) => {
            // Vendor chunk for node_modules
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // State management
              if (id.includes('zustand') || id.includes('immer')) {
                return 'state-vendor';
              }
              // UI libraries
              if (id.includes('@mui') || id.includes('@emotion') || id.includes('styled-components')) {
                return 'ui-vendor';
              }
              // Utilities
              if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                return 'utils-vendor';
              }
              // Other vendor dependencies
              return 'vendor';
            }
            
            // Crisis features (always loaded)
            if (id.includes('services/crisis') || id.includes('components/Crisis')) {
              return 'crisis-core';
            }
            
            // Components chunk
            if (id.includes('/components/')) {
              return 'components';
            }
            
            // Views chunk  
            if (id.includes('/views/')) {
              return 'views';
            }
            
            // Stores chunk
            if (id.includes('/stores/')) {
              return 'stores';
            }
            
            // Wellness features
            if (id.includes('wellness') || id.includes('mood') || id.includes('assessment')) {
              return 'wellness';
            }
            
            // Communication features
            if (id.includes('chat') || id.includes('message') || id.includes('websocket')) {
              return 'communication';
            }
            
            // Utils chunk
            if (id.includes('/utils/') || id.includes('/services/')) {
              return 'utils';
            }
          },
          assetFileNames: (assetInfo) => {
            // Organize assets by type using facadeModuleId when available
            const ext = assetInfo.names?.[0]?.split('.').pop() || '';
            
            // Exclude videos from build assets - handle via VideoLoader
            if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
              return 'excluded/videos/[name].[ext]';
            }
            
            if (ext === 'css') {
              return 'assets/css/[name]-[hash].css';
            }
            if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'avif'].includes(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      },
      // Optimize for mobile networks
      terserOptions: {
        compress: {
          drop_console: isProduction, // Remove console.log in production
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2, // Two passes for better compression
          ecma: 2020,
          module: true,
          toplevel: true
        },
        format: {
          comments: false, // Remove all comments
          ecma: 2020
        },
        mangle: {
          safari10: true, // Work around Safari 10 bugs
          properties: {
            regex: /^_/ // Mangle properties starting with _
          }
        }
      },
      // CSS minification options
      cssMinify: isProduction ? 'lightningcss' : false
    },
    server: {
      port: parseInt(process.env.PORT || '3000'),
      strictPort: false,
      host: process.env.HOST || 'localhost',
      fs: {
        allow: ['..'],
        strict: true
      },
      hmr: {
        overlay: !isProduction,
        host: process.env.HMR_HOST || 'localhost',
        port: parseInt(process.env.HMR_PORT || '3001')
      },
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || true,
        credentials: true
      },
      proxy: isProduction ? {} : {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: parseInt(process.env.PREVIEW_PORT || '4173'),
      host: process.env.PREVIEW_HOST || 'localhost',
      strictPort: true
    },
    define: {
      // Fix CommonJS compatibility issues
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
      'process.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
      __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: !isProduction,
      __PROD__: isProduction
    },
    // Optimize dependencies for mobile with CommonJS compatibility
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'react-markdown',
        'buffer',
        // Force bundling of potential CommonJS modules
        'i18next',
        'react-i18next',
        // Add Rollup for build process
        'rollup'
      ],
      exclude: [
        // Exclude service worker related files
        'src/services/serviceWorkerManager.ts',
        // Exclude all server-side dependencies
        'pg',
        'pg-protocol',
        'jsonwebtoken',
        'bcryptjs',
        '@neondatabase/serverless',
        'drizzle-orm',
        'openai',
        '@anthropic-ai/sdk'
      ],
      esbuildOptions: {
        target: 'esnext',
        jsx: 'automatic',
        jsxImportSource: 'react',
        define: {
          global: 'globalThis'
        }
      }
    }
  };
});