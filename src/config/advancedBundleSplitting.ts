/**
 * Advanced Bundle Splitting Configuration
 * Optimizes code splitting for better performance
 */

export interface ChunkGroup {
  name: string;
  test: RegExp | ((module: any) => boolean);
  priority: number;
  reuseExistingChunk?: boolean;
  enforce?: boolean;
}

export const vendorGroups: ChunkGroup[] = [
  {
    name: 'react-vendor',
    test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
    priority: 30,
    reuseExistingChunk: true
  },
  {
    name: 'ui-vendor',
    test: /[\\/]node_modules[\\/](@mui|@emotion|lucide-react)[\\/]/,
    priority: 25,
    reuseExistingChunk: true
  },
  {
    name: 'utils-vendor',
    test: /[\\/]node_modules[\\/](lodash|date-fns|axios)[\\/]/,
    priority: 20,
    reuseExistingChunk: true
  },
  {
    name: 'common-vendor',
    test: /[\\/]node_modules[\\/]/,
    priority: 10,
    reuseExistingChunk: true
  }
];

export const appChunks: ChunkGroup[] = [
  {
    name: 'crisis',
    test: /[\\/]src[\\/](components|views)[\\/].*[Cc]risis.*\.(tsx?|jsx?)$/,
    priority: 15,
    enforce: true
  },
  {
    name: 'journal',
    test: /[\\/]src[\\/](components|views)[\\/].*[Jj]ournal.*\.(tsx?|jsx?)$/,
    priority: 14,
    enforce: true
  },
  {
    name: 'mood',
    test: /[\\/]src[\\/](components|views)[\\/].*[Mm]ood.*\.(tsx?|jsx?)$/,
    priority: 13,
    enforce: true
  },
  {
    name: 'analytics',
    test: /[\\/]src[\\/](components|views)[\\/].*[Aa]nalytics.*\.(tsx?|jsx?)$/,
    priority: 12,
    enforce: true
  }
];

export interface SplitChunksConfig {
  chunks: 'all' | 'async' | 'initial';
  minSize: number;
  maxSize?: number;
  minChunks: number;
  maxAsyncRequests: number;
  maxInitialRequests: number;
  cacheGroups: Record<string, any>;
}

export const getSplitChunksConfig = (): SplitChunksConfig => {
  const cacheGroups: Record<string, any> = {};
  
  // Add vendor groups
  vendorGroups.forEach(group => {
    cacheGroups[group.name] = {
      test: group.test,
      priority: group.priority,
      reuseExistingChunk: group.reuseExistingChunk,
      enforce: group.enforce
    };
  });
  
  // Add app chunks
  appChunks.forEach(chunk => {
    cacheGroups[chunk.name] = {
      test: chunk.test,
      priority: chunk.priority,
      enforce: chunk.enforce,
      reuseExistingChunk: chunk.reuseExistingChunk
    };
  });
  
  return {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    cacheGroups
  };
};

export const webpackOptimization = {
  splitChunks: getSplitChunksConfig(),
  runtimeChunk: 'single',
  moduleIds: 'deterministic' as const,
  minimize: true,
  sideEffects: false,
  usedExports: true
};

export const preloadModules = [
  'react',
  'react-dom',
  'react-router-dom'
];

export const prefetchModules = [
  '@/views/JournalView',
  '@/views/MoodView',
  '@/views/AnalyticsView'
];

export default {
  vendorGroups,
  appChunks,
  getSplitChunksConfig,
  webpackOptimization,
  preloadModules,
  prefetchModules
};
