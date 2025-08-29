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

// Dynamic import for legacy plugin to handle potential loading issues
let legacy: any;
// Legacy plugin is disabled for now to avoid build issues
// If needed, it can be imported dynamically:
// legacy = await import('@vitejs/plugin-legacy').then(m => m.default).catch(() => null);

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
      sourcemap: !isProduction, // No sourcemaps in production to reduce size
      assetsInlineLimit: 4096, // Inline small assets
      cssCodeSplit: true, // Split CSS for better caching
      manifest: false,
      minify: isProduction ? 'terser' : false, // Aggressive minification with terser
      target: 'es2015', // Support older browsers while maintaining performance
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
          pure_funcs: isProduction ? ['console.log', 'console.info'] : []
        }
      }
    },
    server: {
      port: 3000,
      strictPort: false,
      fs: {
        allow: ['..']
      },
      hmr: {
        overlay: false,
        host: 'localhost'
      }
    },
    define: {
      // Fix CommonJS compatibility issues
      global: 'globalThis',
      'process.env': JSON.stringify(env)
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