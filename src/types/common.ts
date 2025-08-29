/**
 * Common type definitions used throughout the application
 * These replace generic "any" types with more specific, type-safe alternatives
 */

// For objects with string keys and unknown values (replaces Record<string, any>)
export type AnyObject = Record<string, unknown>;

// For JSON-serializable data
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// For event properties and analytics data
export type EventProperties = {
  [key: string]: string | number | boolean | undefined | null | Date;
};

// For form data
export type FormData = {
  [key: string]: string | number | boolean | File | FileList | undefined;
};

// For API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
  success: boolean;
}

// For pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  total?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// For loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// For async operations
export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// For component props that accept children
export interface WithChildren {
  children: React.ReactNode;
}

// For components that can be disabled
export interface Disableable {
  disabled?: boolean;
}

// For components with loading states
export interface Loadable {
  loading?: boolean;
}

// For components with error states
export interface WithError {
  error?: string | null;
}

// For timestamp-related data
export interface Timestamped {
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// For user identification
export interface WithUserId {
  userId: string;
}

// For optional user identification (anonymous support)
export interface WithOptionalUserId {
  userId?: string;
}

// For components with optional className
export interface WithClassName {
  className?: string;
}

// For components with optional style
export interface WithStyle {
  style?: React.CSSProperties;
}

// For keyboard event handling
export type KeyboardEventHandler = (event: React.KeyboardEvent) => void;

// For mouse event handling
export type MouseEventHandler = (event: React.MouseEvent) => void;

// For form event handling
export type FormEventHandler = (event: React.FormEvent) => void;

// For change event handling
export type ChangeEventHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;

// For generic event handlers
export type EventHandler<T = Event> = (event: T) => void;

// For callback functions
export type Callback<T = void> = () => T;
export type CallbackWithParam<P, T = void> = (param: P) => T;

// For validation functions
export type ValidationFunction<T> = (value: T) => string | null;

// For filter functions
export type FilterFunction<T> = (item: T) => boolean;

// For sort functions
export type SortFunction<T> = (a: T, b: T) => number;

// For mapping functions
export type MapFunction<T, R> = (item: T, index?: number) => R;

// For reducer actions
export interface Action<T = string, P = unknown> {
  type: T;
  payload?: P;
}

// For configuration objects
export interface Config {
  [key: string]: string | number | boolean | Config;
}

// For environment variables
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
}

// For feature flags
export interface FeatureFlags {
  [featureName: string]: boolean;
}

// For theme configuration
export interface ThemeConfig {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

// For accessibility
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
}

// For data attributes
export interface DataAttributes {
  [key: `data-${string}`]: string | number | boolean;
}

// Assessment type for mental health assessments
export interface Assessment {
  id: string;
  type: 'phq-9' | 'gad-7' | 'cultural' | 'custom';
  score: number;
  answers: (number | string)[];
  completedAt: string;
  interpretation: string;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';
  recommendations: string[];
  cultural?: {
    languageCode: string;
    culturalContext: string;
    adaptedQuestions?: string[];
    culturalFactors?: string[];
  };
  metadata?: {
    sessionDuration?: number;
    deviceInfo?: string;
    location?: string;
    timeOfDay?: string;
  };
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
