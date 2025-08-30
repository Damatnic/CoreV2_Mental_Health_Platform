#!/usr/bin/env node

/**
 * Critical Issues Fix Script
 * Fixes all HIGH PRIORITY issues in the Mental Health Platform
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting Critical Issues Fix...\n');

// Issue tracking
const issues = {
  fixed: [],
  failed: [],
  skipped: []
};

// Helper function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`  → ${description}...`);
    execSync(command, { stdio: 'inherit' });
    issues.fixed.push(description);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed: ${description}`);
    issues.failed.push(description);
    return false;
  }
}

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Helper function to create file if not exists
function ensureFile(filePath, content) {
  if (!fileExists(filePath)) {
    const dir = path.dirname(filePath);
    if (!fileExists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Created: ${path.basename(filePath)}`);
    return true;
  }
  console.log(`  → Exists: ${path.basename(filePath)}`);
  return false;
}

// Fix 1: Install missing dependencies
console.log('1. Installing Missing Dependencies');
console.log('===================================');

const dependencies = [
  'socket.io-client',
  '@types/socket.io-client',
  'events'
];

dependencies.forEach(dep => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
    runCommand(`npm install ${dep}`, `Install ${dep}`);
  } else {
    console.log(`  → ${dep} already installed`);
    issues.skipped.push(`${dep} already installed`);
  }
});

// Fix 2: Create missing type definitions
console.log('\n2. Creating Type Definitions');
console.log('=============================');

const typeDefinitions = `/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WEBSOCKET_URL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_GOOGLE_GEMINI_API_KEY: string;
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  readonly VITE_988_API_KEY: string;
  readonly VITE_CRISIS_TEXT_API_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_AI_CHAT: string;
  readonly VITE_ENABLE_CRISIS_DETECTION: string;
  readonly VITE_ENABLE_988_INTEGRATION: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_PWA_NAME: string;
  readonly VITE_PWA_SHORT_NAME: string;
  readonly VITE_PWA_THEME_COLOR: string;
  readonly JWT_SECRET: string;
  readonly DATABASE_URL: string;
  readonly DATABASE_SSL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.scss' {
  const content: any;
  export default content;
}`;

ensureFile('src/vite-env.d.ts', typeDefinitions);

// Fix 3: Create missing global type declarations
console.log('\n3. Creating Global Type Declarations');
console.log('=====================================');

const globalTypes = `declare global {
  interface Window {
    workbox?: any;
    __WB_MANIFEST?: any[];
    Notification?: any;
    webkitNotification?: any;
    mozNotification?: any;
    msNotification?: any;
    crypto: Crypto;
    ethereum?: any;
  }

  interface Navigator {
    standalone?: boolean;
    mozGetUserMedia?: any;
    msGetUserMedia?: any;
    webkitGetUserMedia?: any;
  }

  interface Process {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    };
  }
}

export {};`;

ensureFile('src/global.d.ts', globalTypes);

// Fix 4: Update tsconfig.json to include proper types
console.log('\n4. Updating TypeScript Configuration');
console.log('=====================================');

const tsconfigPath = 'tsconfig.json';
if (fileExists(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Ensure types array exists
    if (!tsconfig.compilerOptions.types) {
      tsconfig.compilerOptions.types = [];
    }
    
    // Add missing types
    const requiredTypes = ['node', 'jest', '@testing-library/jest-dom'];
    requiredTypes.forEach(type => {
      if (!tsconfig.compilerOptions.types.includes(type)) {
        tsconfig.compilerOptions.types.push(type);
      }
    });
    
    // Ensure include patterns
    if (!tsconfig.include) {
      tsconfig.include = [];
    }
    
    const requiredIncludes = ['src/**/*', 'src/**/*.tsx', 'src/**/*.ts', 'src/**/*.d.ts'];
    requiredIncludes.forEach(pattern => {
      if (!tsconfig.include.includes(pattern)) {
        tsconfig.include.push(pattern);
      }
    });
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('  ✓ Updated tsconfig.json');
    issues.fixed.push('TypeScript configuration');
  } catch (error) {
    console.error('  ✗ Failed to update tsconfig.json');
    issues.failed.push('TypeScript configuration');
  }
} else {
  console.log('  ✗ tsconfig.json not found');
  issues.failed.push('tsconfig.json not found');
}

// Fix 5: Create browser-compatible EventEmitter if needed
console.log('\n5. Creating Browser-Compatible Utilities');
console.log('=========================================');

const eventEmitterCode = `/**
 * Browser-compatible EventEmitter implementation
 */
export class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener?: Function): this {
    if (!listener) {
      this.events.delete(event);
    } else {
      const listeners = this.events.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(\`Error in event listener for \${event}:\`, error);
        }
      });
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }
}

export default EventEmitter;`;

ensureFile('src/utils/EventEmitter.ts', eventEmitterCode);

// Fix 6: Create missing Jest setup file
console.log('\n6. Creating Jest Setup');
console.log('=======================');

const jestSetup = `import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.VITE_WEBSOCKET_URL = 'ws://localhost:3001';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};`;

ensureFile('src/setupTests.ts', jestSetup);

// Fix 7: Verify critical services exist
console.log('\n7. Verifying Critical Services');
console.log('===============================');

const criticalFiles = [
  'src/services/auth/authService.ts',
  'src/services/database/databaseService.ts',
  'src/services/websocket/socketClient.ts',
  'src/hooks/useAuth.ts',
  'src/hooks/useWebSocket.ts',
  'src/hooks/useProfessionalVerification.ts',
  'src/hooks/useCrisisAssessment.ts',
  'src/hooks/useCulturalCompetencyAssessment.ts'
];

criticalFiles.forEach(file => {
  if (fileExists(file)) {
    console.log(`  ✓ ${path.basename(file)}`);
    issues.fixed.push(`Verified ${path.basename(file)}`);
  } else {
    console.log(`  ✗ Missing: ${file}`);
    issues.failed.push(`Missing ${file}`);
  }
});

// Fix 8: Clean and reinstall node_modules if needed
console.log('\n8. Dependency Health Check');
console.log('===========================');

if (!fileExists('node_modules')) {
  console.log('  → Installing dependencies...');
  runCommand('npm install', 'Install all dependencies');
} else {
  console.log('  ✓ node_modules exists');
  
  // Check for corrupted modules
  try {
    execSync('npm ls --depth=0', { stdio: 'pipe' });
    console.log('  ✓ Dependencies are healthy');
    issues.fixed.push('Dependencies healthy');
  } catch {
    console.log('  ⚠ Some dependencies have issues');
    console.log('  → Attempting to fix...');
    runCommand('npm audit fix', 'Fix dependency issues');
  }
}

// Summary Report
console.log('\n' + '='.repeat(50));
console.log('CRITICAL ISSUES FIX SUMMARY');
console.log('='.repeat(50));

console.log(`\n✅ Fixed (${issues.fixed.length}):`);
issues.fixed.forEach(item => console.log(`  • ${item}`));

if (issues.skipped.length > 0) {
  console.log(`\n⏭ Skipped (${issues.skipped.length}):`);
  issues.skipped.forEach(item => console.log(`  • ${item}`));
}

if (issues.failed.length > 0) {
  console.log(`\n❌ Failed (${issues.failed.length}):`);
  issues.failed.forEach(item => console.log(`  • ${item}`));
  
  console.log('\n⚠ MANUAL INTERVENTION REQUIRED:');
  console.log('  1. Review the failed items above');
  console.log('  2. Check error logs for details');
  console.log('  3. Run "npm install" manually if needed');
  console.log('  4. Ensure all environment variables are set in .env');
} else {
  console.log('\n✨ All critical issues have been resolved!');
  console.log('\nNext steps:');
  console.log('  1. Run "npm run build" to verify the build');
  console.log('  2. Run "npm run dev" to start the development server');
  console.log('  3. Run "npm test" to verify tests pass');
}

console.log('\n' + '='.repeat(50));

// Exit with appropriate code
process.exit(issues.failed.length > 0 ? 1 : 0);