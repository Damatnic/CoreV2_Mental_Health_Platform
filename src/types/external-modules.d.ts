/**
 * Type definitions for external modules
 * 
 * This file provides type definitions for external packages that may not have
 * their own TypeScript definitions or are missing from node_modules.
 */

// IDB - IndexedDB wrapper (if not installed)
declare module 'idb' {
  export interface DBSchema {}
  export interface IDBPDatabase<T = unknown> {
    get(store: string, key: any): Promise<any>;
    put(store: string, value: any, key?: any): Promise<any>;
    delete(store: string, key: any): Promise<void>;
    clear(store: string): Promise<void>;
    getAll(store: string): Promise<any[]>;
    getAllKeys(store: string): Promise<any[]>;
    transaction(stores: string | string[], mode?: 'readonly' | 'readwrite'): any;
    close(): void;
  }
  export function openDB<T = unknown>(
    name: string,
    version?: number,
    options?: any
  ): Promise<IDBPDatabase<T>>;
  export function deleteDB(name: string): Promise<void>;
}

// Crypto-js (if used for encryption)
declare module 'crypto-js' {
  export const AES: any;
  export const enc: {
    Utf8: any;
    Base64: any;
    Hex: any;
  };
  export const SHA256: (message: string) => any;
  export const HmacSHA256: (message: string, key: string) => any;
}

// Socket.io client (if not installed)
declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    on(event: string, handler: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    off(event: string, handler?: (...args: any[]) => void): void;
    connect(): void;
    disconnect(): void;
  }
  export function io(url?: string, options?: any): Socket;
}

// Auth0 types (if not installed)
declare module '@auth0/auth0-react' {
  export interface Auth0ContextInterface {
    isAuthenticated: boolean;
    isLoading: boolean;
    user?: any;
    loginWithRedirect: (options?: any) => Promise<void>;
    logout: (options?: any) => void;
    getAccessTokenSilently: (options?: any) => Promise<string>;
  }
  export const useAuth0: () => Auth0ContextInterface;
  export const Auth0Provider: React.FC<any>;
}

// Sentry (if not installed)
declare module '@sentry/react' {
  export function init(options: any): void;
  export function captureException(error: Error, context?: any): string;
  export function captureMessage(message: string, level?: string): string;
  export function setUser(user: any | null): void;
  export function setContext(name: string, context: any): void;
  export function addBreadcrumb(breadcrumb: any): void;
  export const ErrorBoundary: React.ComponentType<any>;
  export function withProfiler<P>(
    Component: React.ComponentType<P>,
    options?: any
  ): React.ComponentType<P>;
}

// OpenTelemetry (if not installed)
declare module '@opentelemetry/api' {
  export interface Tracer {
    startSpan(name: string, options?: any): any;
  }
  export function trace(name: string): Tracer;
  export const context: any;
  export const propagation: any;
}

// Framer Motion (if not installed)
declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: React.FC<any>;
  export function useAnimation(): any;
  export function useMotionValue(initial: number): any;
  export function useTransform(value: any, inputRange: number[], outputRange: any[]): any;
  export const useSpring: any;
  export const useScroll: any;
}

// i18next (if not installed)
declare module 'i18next' {
  export interface TFunction {
    (key: string, options?: any): string;
  }
  export function init(options: any): Promise<TFunction>;
  export function use(plugin: any): any;
  export function changeLanguage(lng: string): Promise<TFunction>;
  export const t: TFunction;
}

declare module 'react-i18next' {
  export function useTranslation(namespace?: string): {
    t: (key: string, options?: any) => string;
    i18n: any;
    ready: boolean;
  };
  export const Trans: React.FC<any>;
  export const I18nextProvider: React.FC<any>;
}

// React Hook Form (if not installed)
declare module 'react-hook-form' {
  export function useForm<T = any>(options?: any): {
    register: any;
    handleSubmit: any;
    formState: any;
    watch: any;
    setValue: any;
    getValues: any;
    reset: any;
    control: any;
  };
  export const Controller: React.ComponentType<any>;
  export const FormProvider: React.ComponentType<any>;
  export const useFormContext: () => any;
}

// Radix UI (if not installed)
declare module '@radix-ui/react-*' {
  const Component: React.FC<any>;
  export default Component;
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
  export const Item: React.FC<any>;
}

// Web Vitals (if not installed)
declare module 'web-vitals' {
  export interface Metric {
    name: string;
    value: number;
    delta: number;
    id: string;
    entries: any[];
  }
  export type ReportHandler = (metric: Metric) => void;
  export function getCLS(onReport: ReportHandler): void;
  export function getFID(onReport: ReportHandler): void;
  export function getFCP(onReport: ReportHandler): void;
  export function getLCP(onReport: ReportHandler): void;
  export function getTTFB(onReport: ReportHandler): void;
}

// Workbox (for service workers)
declare module 'workbox-*' {
  export const precacheAndRoute: (entries: any[]) => void;
  export const registerRoute: (match: any, handler: any) => void;
  export const NetworkFirst: any;
  export const CacheFirst: any;
  export const StaleWhileRevalidate: any;
}

// DOMPurify (for sanitizing HTML)
declare module 'dompurify' {
  interface DOMPurifyI {
    sanitize(source: string, config?: any): string;
    setConfig(config: any): void;
    clearConfig(): void;
    addHook(entryPoint: string, hookFunction: Function): void;
    removeHook(entryPoint: string): void;
    removeHooks(entryPoint: string): void;
    removeAllHooks(): void;
  }
  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}

// Add process.env types for Vite
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_ENABLE_ANALYTICS?: string;
    readonly VITE_ENABLE_PWA?: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Placeholder for any other missing modules
declare module '*';