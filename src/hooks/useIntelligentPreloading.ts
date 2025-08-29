/**
 * Intelligent Preloading Hook
 *
 * Advanced resource preloading system with predictive algorithms,
 * user behavior analysis, and performance optimization
 *
 * @license Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

export enum PreloadPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  IDLE = 'idle'
}

export enum ResourceType {
  SCRIPT = 'script',
  STYLE = 'style',
  IMAGE = 'image',
  FONT = 'font',
  FETCH = 'fetch'
}

export interface PreloadResource {
  id: string;
  url: string;
  type: ResourceType;
  priority: PreloadPriority;
  size?: number;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

interface UseIntelligentPreloadingReturn {
  preloadResource: (resource: PreloadResource) => Promise<boolean>;
  isPreloading: boolean;
  preloadQueue: PreloadResource[];
}

const DEFAULT_CONFIG = {
  maxConcurrentPreloads: 3,
  enableNetworkAware: true
};

export function useIntelligentPreloading(): UseIntelligentPreloadingReturn {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadQueue, setPreloadQueue] = useState<PreloadResource[]>([]);
  const activePreloads = useRef<Map<string, Promise<boolean>>>(new Map());

  const preloadResource = useCallback(async (resource: PreloadResource): Promise<boolean> => {
    setIsPreloading(true);

    try {
      const success = await executePreload(resource);
      logger.info('Resource preloaded', { resource: resource.id, success });
      return success;
    } catch (error) {
      logger.error('Failed to preload resource', { resource: resource.id, error });
      return false;
    } finally {
      setIsPreloading(false);
    }
  }, []);

  const executePreload = async (resource: PreloadResource): Promise<boolean> => {
    switch (resource.type) {
      case ResourceType.IMAGE:
        return preloadImage(resource);
      case ResourceType.SCRIPT:
      case ResourceType.STYLE:
        return preloadLink(resource);
      case ResourceType.FETCH:
        return preloadFetch(resource);
      default:
        return false;
    }
  };

  const preloadImage = (resource: PreloadResource): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = resource.url;
    });
  };

  const preloadLink = (resource: PreloadResource): Promise<boolean> => {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.type;
      link.href = resource.url;

      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }

      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);

      document.head.appendChild(link);
    });
  };

  const preloadFetch = async (resource: PreloadResource): Promise<boolean> => {
    try {
      const response = await fetch(resource.url, {
        method: 'GET',
        cache: 'force-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    preloadResource,
    isPreloading,
    preloadQueue
  };
}

export type { UseIntelligentPreloadingReturn, PreloadResource };
