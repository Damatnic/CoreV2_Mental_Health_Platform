/**
 * Webpack Bundle Optimization Configuration
 * Advanced optimizations for production builds
 */

const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const glob = require('glob');
const path = require('path');

// Helper to get all source files for PurgeCSS
const PATHS = {
  src: path.join(__dirname, 'src')
};

module.exports = {
  mode: 'production',
  
  // Entry points with manual chunking
  entry: {
    main: './src/main.tsx',
    // Separate entry for crisis features (always loaded)
    crisis: './src/services/crisisDetectionService.ts',
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    clean: true,
    // Asset modules
    assetModuleFilename: 'assets/[hash][ext][query]',
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      // JavaScript minification
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
        extractComments: false,
      }),
      
      // CSS minification
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
            },
          ],
        },
      }),
    ],
    
    // Split chunks configuration
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      maxAsyncRequests: 25,
      cacheGroups: {
        // Vendor chunks
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
          priority: 10,
        },
        
        // React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20,
          enforce: true,
        },
        
        // State management
        state: {
          test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
          name: 'state-vendor',
          priority: 15,
        },
        
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion|styled-components)[\\/]/,
          name: 'ui-vendor',
          priority: 15,
        },
        
        // Utilities
        utils: {
          test: /[\\/]node_modules[\\/](lodash|date-fns|axios)[\\/]/,
          name: 'utils-vendor',
          priority: 15,
        },
        
        // Common components (used across multiple routes)
        common: {
          test: /[\\/]src[\\/]components[\\/](common|shared)[\\/]/,
          name: 'common-components',
          priority: 5,
          minChunks: 2,
          reuseExistingChunk: true,
        },
        
        // Styles
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        },
      },
    },
    
    // Runtime chunk for better caching
    runtimeChunk: {
      name: 'runtime',
    },
    
    // Module IDs
    moduleIds: 'deterministic',
    
    // Side effects
    sideEffects: false,
    
    // Tree shaking
    usedExports: true,
  },
  
  module: {
    rules: [
      // TypeScript/JavaScript
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  modules: false,
                  targets: {
                    browsers: ['>0.25%', 'not dead'],
                  },
                  useBuiltIns: 'usage',
                  corejs: 3,
                }],
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
              plugins: [
                // Remove console logs in production
                'transform-remove-console',
                // Optimize React
                '@babel/plugin-transform-react-constant-elements',
                '@babel/plugin-transform-react-inline-elements',
                // Dynamic imports
                '@babel/plugin-syntax-dynamic-import',
                // Class properties
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        ],
      },
      
      // CSS
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[hash:base64:5]',
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-preset-env',
                  'autoprefixer',
                  ['cssnano', {
                    preset: ['default', {
                      discardComments: { removeAll: true },
                    }],
                  }],
                ],
              },
            },
          },
        ],
      },
      
      // Images
      {
        test: /\.(png|jpg|jpeg|gif|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[hash][ext][query]',
        },
      },
      
      // SVG as React components
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]',
        },
      },
    ],
  },
  
  plugins: [
    // Extract CSS
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),
    
    // Remove unused CSS
    new PurgeCSSPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
      safelist: {
        standard: [
          /^modal/,
          /^toast/,
          /^crisis/,
          /^loading/,
        ],
        deep: [/^theme-/],
        greedy: [/data-theme$/],
      },
    }),
    
    // Compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Brotli compression
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11,
      },
      threshold: 10240,
      minRatio: 0.8,
    }),
    
    // Image optimization
    new ImageMinimizerPlugin({
      minimizer: {
        implementation: ImageMinimizerPlugin.imageminMinify,
        options: {
          plugins: [
            ['imagemin-gifsicle', { interlaced: true }],
            ['imagemin-mozjpeg', { progressive: true, quality: 85 }],
            ['imagemin-pngquant', { quality: [0.6, 0.8] }],
            ['imagemin-svgo', {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            }],
          ],
        },
      },
      generator: [
        {
          type: 'asset',
          preset: 'webp-custom-name',
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: ['imagemin-webp'],
          },
        },
      ],
    }),
    
    // Manifest for caching
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: '/',
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);

        const entrypointFiles = entrypoints.main.filter(
          fileName => !fileName.endsWith('.map')
        );

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    }),
    
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }),
  ].filter(Boolean),
  
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 250000, // 250kb
    maxAssetSize: 250000, // 250kb
    assetFilter: (assetFilename) => {
      // Only provide hints for JS and CSS files
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    },
  },
  
  // Resolve
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@types': path.resolve(__dirname, 'src/types'),
      // Replace heavy libraries with lighter alternatives
      'moment': 'dayjs',
      'lodash': 'lodash-es',
    },
    // Prefer module field for better tree shaking
    mainFields: ['module', 'main'],
  },
  
  // Stats for better debugging
  stats: {
    assets: true,
    chunks: true,
    chunkModules: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: true,
    warnings: true,
    publicPath: false,
    performance: true,
    timings: true,
  },
};

// Export helper functions for optimization analysis
module.exports.analyzeBundle = () => {
  process.env.ANALYZE = 'true';
  return module.exports;
};

module.exports.getOptimizationReport = () => {
  const stats = require('./dist/bundle-stats.json');
  
  const report = {
    totalSize: 0,
    chunks: [],
    largestChunks: [],
    recommendations: [],
  };
  
  // Calculate total size
  stats.assets.forEach(asset => {
    report.totalSize += asset.size;
  });
  
  // Find largest chunks
  report.largestChunks = stats.assets
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(asset => ({
      name: asset.name,
      size: `${(asset.size / 1024).toFixed(2)} KB`,
    }));
  
  // Generate recommendations
  if (report.totalSize > 1024 * 1024) {
    report.recommendations.push('Total bundle size exceeds 1MB. Consider more aggressive code splitting.');
  }
  
  const largeChunks = stats.assets.filter(asset => asset.size > 250 * 1024);
  if (largeChunks.length > 0) {
    report.recommendations.push(`${largeChunks.length} chunks exceed 250KB. Consider splitting them further.`);
  }
  
  return report;
};