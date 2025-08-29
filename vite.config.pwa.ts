import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced PWA Configuration for Mental Health Platform
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    base: '/',
    plugins: [
      react({
        // React optimization for better performance
        babel: {
          plugins: isProduction ? [
            ['@babel/plugin-transform-react-constant-elements'],
            ['@babel/plugin-transform-react-inline-elements']
          ] : []
        }
      }),
      
      // Enhanced PWA Configuration
      VitePWA({
        registerType: 'prompt', // Prompt for updates
        includeAssets: [
          'icon.svg',
          'icon-192.png',
          'icon-512.png',
          'robots.txt',
          'sitemap.xml',
          'offline.html',
          'offline-crisis.html',
          'crisis-resources.json',
          'emergency-contacts.json',
          'offline-coping-strategies.json'
        ],
        
        manifest: {
          name: 'Astral Core - Mental Health Support',
          short_name: 'Astral Core',
          description: 'Anonymous peer-to-peer mental health support platform with offline crisis resources',
          theme_color: '#667eea',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          id: 'astral-core-mental-health',
          
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ],
          
          shortcuts: [
            {
              name: 'Crisis Support',
              short_name: 'Crisis',
              description: 'Immediate access to crisis resources',
              url: '/crisis',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'Emergency Help',
              short_name: '988',
              description: 'Call 988 Crisis Lifeline',
              url: '/emergency',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'AI Therapist',
              short_name: 'AI Chat',
              description: 'Chat with AI therapist',
              url: '/ai-chat',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'Safety Plan',
              short_name: 'Safety',
              description: 'Access your safety plan',
              url: '/safety-plan',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            }
          ],
          
          categories: ['health', 'medical', 'lifestyle', 'social'],
          lang: 'en',
          dir: 'ltr',
          prefer_related_applications: false,
          
          // Advanced PWA features
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          edge_side_panel: {
            preferred_width: 400
          },
          launch_handler: {
            client_mode: 'focus-existing'
          },
          handle_links: 'preferred',
          capture_links: 'new-client',
          
          // Share target for crisis resources
          share_target: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
              files: [
                {
                  name: 'file',
                  accept: ['image/*', 'text/*', 'application/json']
                }
              ]
            }
          }
        },
        
        workbox: {
          // Use custom service worker
          swSrc: 'public/sw-enhanced-pwa.js',
          swDest: 'sw.js',
          
          // Global settings
          globDirectory: 'dist',
          globPatterns: [
            '**/*.{html,js,css,png,jpg,jpeg,svg,gif,webp,woff,woff2,ttf,otf}'
          ],
          
          // Runtime caching strategies
          runtimeCaching: [
            // Crisis resources - Network first with quick timeout
            {
              urlPattern: /\/api\/(crisis|emergency|safety)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'crisis-api-cache',
                networkTimeoutSeconds: 1, // 1 second timeout for crisis
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            
            // Wellness API - Stale while revalidate
            {
              urlPattern: /\/api\/(wellness|mood|assessments)/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'wellness-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            
            // Chat API - Network only with offline fallback
            {
              urlPattern: /\/api\/(chat|ai)/,
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'chat-queue',
                  options: {
                    maxRetentionTime: 24 * 60 // 24 hours
                  }
                },
                plugins: [
                  {
                    fetchDidFail: async ({ originalRequest, error }) => {
                      // Store failed chat messages for sync
                      console.log('Chat request failed, queuing for sync');
                    }
                  }
                ]
              }
            },
            
            // Static assets - Cache first
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            
            // Videos - Cache first with large cache
            {
              urlPattern: /\.(mp4|webm|ogg)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'video-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                rangeRequests: true,
                cacheableResponse: {
                  statuses: [0, 200, 206] // Include partial content
                }
              }
            },
            
            // JavaScript and CSS - Stale while revalidate
            {
              urlPattern: /\.(js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'js-css-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
              }
            }
          ],
          
          // Skip waiting and claim clients
          skipWaiting: true,
          clientsClaim: true,
          
          // Offline page fallback
          navigateFallback: '/offline.html',
          navigateFallbackDenylist: [/^\/api\//],
          
          // Clean up outdated caches
          cleanupOutdatedCaches: true,
          
          // Source map for debugging
          sourcemap: !isProduction
        },
        
        // Development options
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        },
        
        // Self-destroying service worker for cleanup
        selfDestroying: false
      }),
      
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
      
      // Bundle visualizer
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        buffer: 'buffer',
        stream: 'stream-browserify',
        util: 'util',
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@views': path.resolve(__dirname, './src/views'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@types': path.resolve(__dirname, './src/types')
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : []
    },
    
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      
      // Optimize for mobile with smaller chunks
      chunkSizeWarningLimit: 500, // 500kb warning
      assetsInlineLimit: 4096, // 4kb inline limit
      
      // Enable CSS code splitting
      cssCodeSplit: true,
      cssMinify: isProduction ? 'lightningcss' : false,
      
      // Minification settings
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          ecma: 2015,
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2
        },
        format: {
          comments: false,
          ecma: 2015
        },
        mangle: {
          safari10: true
        }
      } : undefined,
      
      // Target modern browsers for better performance
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      
      rollupOptions: {
        plugins: [
          nodeResolve({
            preferBuiltins: false,
            browser: true
          })
        ],
        
        // External server-side dependencies
        external: (id) => {
          if (/\.(mp4|webm|mov|avi)$/.test(id)) return true;
          const serverDeps = [
            'pg', 'pg-protocol', 'jsonwebtoken', 'bcryptjs',
            '@neondatabase/serverless', 'drizzle-orm',
            'openai', '@anthropic-ai/sdk'
          ];
          return serverDeps.some(dep => id.includes(dep));
        },
        
        output: {
          // Advanced chunking strategy for optimal performance
          manualChunks: (id) => {
            // Critical crisis features - always loaded
            if (id.includes('crisis') || id.includes('emergency') || id.includes('safety')) {
              return 'crisis-core';
            }
            
            // React ecosystem
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('react-router')) {
                return 'router';
              }
              if (id.includes('zustand') || id.includes('immer')) {
                return 'state';
              }
              if (id.includes('@heroicons') || id.includes('lucide')) {
                return 'icons';
              }
              if (id.includes('i18n')) {
                return 'i18n';
              }
              if (id.includes('markdown')) {
                return 'markdown';
              }
              if (id.includes('chart') || id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('@sentry')) {
                return 'monitoring';
              }
              if (id.includes('workbox')) {
                return 'workbox';
              }
              return 'vendor';
            }
            
            // Application chunks
            if (id.includes('/components/')) {
              if (id.includes('Crisis') || id.includes('Emergency')) {
                return 'components-crisis';
              }
              if (id.includes('Chat') || id.includes('AI')) {
                return 'components-chat';
              }
              if (id.includes('Wellness') || id.includes('Mood')) {
                return 'components-wellness';
              }
              return 'components';
            }
            
            if (id.includes('/views/')) {
              if (id.includes('Crisis') || id.includes('Emergency')) {
                return 'views-crisis';
              }
              if (id.includes('Chat') || id.includes('AI')) {
                return 'views-chat';
              }
              if (id.includes('Wellness') || id.includes('Dashboard')) {
                return 'views-wellness';
              }
              return 'views';
            }
            
            if (id.includes('/services/')) {
              if (id.includes('crisis') || id.includes('emergency')) {
                return 'services-crisis';
              }
              if (id.includes('performance') || id.includes('monitor')) {
                return 'services-performance';
              }
              return 'services';
            }
            
            if (id.includes('/hooks/')) {
              return 'hooks';
            }
            
            if (id.includes('/stores/')) {
              return 'stores';
            }
            
            if (id.includes('/utils/')) {
              return 'utils';
            }
          },
          
          // Asset naming for better caching
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.names?.[0]?.split('.').pop() || '';
            
            if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
              return 'assets/videos/[name]-[hash][extname]';
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash].css';
            }
            if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'avif'].includes(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (['woff', 'woff2', 'ttf', 'otf'].includes(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          
          // Optimize for Core Web Vitals
          experimentalMinChunkSize: 10000 // 10kb minimum chunk size
        }
      }
    },
    
    server: {
      port: 3000,
      strictPort: false,
      host: true, // Allow external connections
      fs: {
        allow: ['..']
      },
      hmr: {
        overlay: false,
        host: 'localhost'
      },
      // Service worker in development
      headers: {
        'Service-Worker-Allowed': '/'
      }
    },
    
    preview: {
      port: 3001,
      host: true,
      headers: {
        'Service-Worker-Allowed': '/'
      }
    },
    
    define: {
      global: 'globalThis',
      'process.env': JSON.stringify(env)
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'react-markdown',
        'buffer',
        'i18next',
        'react-i18next',
        'web-vitals'
      ],
      exclude: [
        'src/services/serviceWorkerManager.ts',
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