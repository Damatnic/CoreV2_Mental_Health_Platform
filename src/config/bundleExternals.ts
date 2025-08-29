/**
 * Bundle Externals Configuration
 * Defines external dependencies that should not be bundled with the application
 */

export interface ExternalConfig {
  [key: string]: string | ExternalDependency;
}

export interface ExternalDependency {
  commonjs: string;
  commonjs2: string;
  amd: string;
  root: string;
}

// CDN versions for external libraries
export const CDN_VERSIONS = {
  react: '18.2.0',
  'react-dom': '18.2.0',
  lodash: '4.17.21',
  'date-fns': '2.29.3',
  axios: '1.4.0'
};

// External dependencies configuration
export const externals: ExternalConfig = {
  // React ecosystem - use CDN in production
  react: {
    commonjs: 'react',
    commonjs2: 'react',
    amd: 'React',
    root: 'React'
  },
  'react-dom': {
    commonjs: 'react-dom',
    commonjs2: 'react-dom',
    amd: 'ReactDOM',
    root: 'ReactDOM'
  },
  'react-router-dom': {
    commonjs: 'react-router-dom',
    commonjs2: 'react-router-dom',
    amd: 'ReactRouterDOM',
    root: 'ReactRouterDOM'
  },

  // Utility libraries
  lodash: {
    commonjs: 'lodash',
    commonjs2: 'lodash',
    amd: '_',
    root: '_'
  },
  'date-fns': {
    commonjs: 'date-fns',
    commonjs2: 'date-fns',
    amd: 'dateFns',
    root: 'dateFns'
  },

  // HTTP client
  axios: {
    commonjs: 'axios',
    commonjs2: 'axios',
    amd: 'axios',
    root: 'axios'
  },

  // Charts and visualization
  'chart.js': {
    commonjs: 'chart.js',
    commonjs2: 'chart.js',
    amd: 'Chart',
    root: 'Chart'
  },

  // Icons
  'lucide-react': 'lucide-react'
};

// Get externals for specific environment
export const getExternals = (env: 'development' | 'production' | 'test'): ExternalConfig => {
  switch (env) {
    case 'production':
      // In production, externalize major libraries to reduce bundle size
      return externals;
      
    case 'development':
      // In development, only externalize very large libraries
      return {
        'chart.js': externals['chart.js'],
        lodash: externals.lodash
      };
      
    case 'test':
      // In testing, don't externalize anything for easier testing
      return {};
      
    default:
      return {};
  }
};

// CDN URLs for external dependencies
export const getCDNUrls = (env: 'development' | 'production'): Record<string, string> => {
  const isProd = env === 'production';
  const suffix = isProd ? '.min.js' : '.js';
  
  return {
    react: `https://unpkg.com/react@${CDN_VERSIONS.react}/umd/react${isProd ? '.production' : '.development'}${suffix}`,
    'react-dom': `https://unpkg.com/react-dom@${CDN_VERSIONS['react-dom']}/umd/react-dom${isProd ? '.production' : '.development'}${suffix}`,
    lodash: `https://unpkg.com/lodash@${CDN_VERSIONS.lodash}/lodash${suffix}`,
    'date-fns': `https://unpkg.com/date-fns@${CDN_VERSIONS['date-fns']}/index${suffix}`,
    axios: `https://unpkg.com/axios@${CDN_VERSIONS.axios}/dist/axios${suffix}`
  };
};

// Generate HTML script tags for CDN dependencies
export const generateCDNScripts = (env: 'development' | 'production'): string[] => {
  const urls = getCDNUrls(env);
  return Object.values(urls).map(url => 
    `<script crossorigin src="${url}"></script>`
  );
};

// Webpack externals function
export const webpackExternals = (env: 'development' | 'production' | 'test') => {
  const externalsConfig = getExternals(env);
  
  return (context: any, request: string, callback: Function) => {
    // Check if request is in externals config
    if (externalsConfig[request]) {
      return callback(null, externalsConfig[request]);
    }
    
    // Check for scoped packages
    const scopedMatch = request.match(/^@([^/]+)\/(.+)$/);
    if (scopedMatch) {
      const [, scope, package_] = scopedMatch;
      const fullName = `@${scope}/${package_}`;
      if (externalsConfig[fullName]) {
        return callback(null, externalsConfig[fullName]);
      }
    }
    
    // Not external, bundle it
    callback();
  };
};

// Rollup externals configuration
export const rollupExternals = (env: 'development' | 'production' | 'test'): string[] => {
  const externalsConfig = getExternals(env);
  return Object.keys(externalsConfig);
};

// Vite externals configuration
export const viteExternals = (env: 'development' | 'production' | 'test') => {
  const externalsConfig = getExternals(env);
  const result: Record<string, string> = {};
  
  Object.entries(externalsConfig).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = value;
    } else {
      result[key] = value.root;
    }
  });
  
  return result;
};

// Bundle analyzer helper
export const getBundleAnalysisExclusions = (): string[] => {
  return Object.keys(externals);
};

export default {
  externals,
  getExternals,
  getCDNUrls,
  generateCDNScripts,
  webpackExternals,
  rollupExternals,
  viteExternals,
  getBundleAnalysisExclusions
};
