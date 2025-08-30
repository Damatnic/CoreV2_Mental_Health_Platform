/**
 * Global type definitions for the Mental Health Platform
 */

declare global {
  interface Window {
    // Service Worker and PWA
    workbox?: any;
    __WB_MANIFEST?: any[];
    
    // Notifications API
    Notification?: any;
    webkitNotification?: any;
    mozNotification?: any;
    msNotification?: any;
    
    // Crypto API
    crypto: Crypto;
    
    // Web3/Ethereum
    ethereum?: any;
    
    // Analytics
    gtag?: Function;
    analytics?: any;
    mixpanel?: any;
    
    // Auth0
    auth0?: any;
    
    // Sentry
    Sentry?: any;
    __SENTRY__?: any;
    
    // Crisis Detection
    crisisDetectionEnabled?: boolean;
    emergencyContactsConfigured?: boolean;
    
    // Feature flags
    __FEATURES__?: {
      [key: string]: boolean;
    };
    
    // Debug utilities
    __DEBUG__?: boolean;
    __APP_VERSION__?: string;
  }

  interface Navigator {
    // PWA
    standalone?: boolean;
    
    // Media
    mozGetUserMedia?: any;
    msGetUserMedia?: any;
    webkitGetUserMedia?: any;
    
    // Permissions
    permissions?: {
      query(descriptor: any): Promise<any>;
    };
    
    // Share API
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
    
    // Vibration API
    vibrate?: (pattern: number | number[]) => boolean;
    
    // Battery API
    getBattery?: () => Promise<any>;
    
    // Connection API
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
    };
    
    // Device Memory
    deviceMemory?: number;
    
    // Hardware Concurrency
    hardwareConcurrency?: number;
  }

  interface Process {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    };
  }

  interface ShareData {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }

  // Node.js globals that might be used in browser environment
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_API_BASE_URL?: string;
      VITE_WEBSOCKET_URL?: string;
      [key: string]: string | undefined;
    }
  }

  // Extend console for custom logging
  interface Console {
    success?: (message?: any, ...optionalParams: any[]) => void;
    warning?: (message?: any, ...optionalParams: any[]) => void;
  }
}

// Module augmentations
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

// Events module for browser environment
declare module 'events' {
  export class EventEmitter {
    on(event: string | symbol, listener: Function): this;
    off(event: string | symbol, listener: Function): this;
    emit(event: string | symbol, ...args: any[]): boolean;
    once(event: string | symbol, listener: Function): this;
    removeAllListeners(event?: string | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    listenerCount(event: string | symbol): number;
    prependListener(event: string | symbol, listener: Function): this;
    prependOnceListener(event: string | symbol, listener: Function): this;
    eventNames(): (string | symbol)[];
  }
}

// Socket.io client types (if not installed)
declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    emit(event: string, ...args: any[]): void;
    connect(): Socket;
    disconnect(): Socket;
    close(): Socket;
    open(): Socket;
  }
  
  export interface SocketOptions {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    auth?: any;
    query?: any;
    transports?: string[];
  }
  
  export default function io(uri?: string, opts?: SocketOptions): Socket;
}

// Ensure this file is treated as a module
export {};