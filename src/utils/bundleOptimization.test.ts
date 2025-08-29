import { describe, it, expect, jest } from '@jest/globals';

interface BundleMetrics {
  size: number;
  gzipSize: number;
  parseTime: number;
  modules: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isAsync: boolean;
}

class BundleOptimizer {
  private chunks: Map<string, ChunkInfo> = new Map();
  private readonly maxChunkSize = 244000; // 244KB
  private readonly minChunkSize = 20000; // 20KB

  analyzeBundle(modules: any[]): BundleMetrics {
    const totalSize = modules.reduce((sum, mod) => sum + (mod.size || 0), 0);
    const gzipSize = Math.floor(totalSize * 0.3); // Estimate 70% compression
    
    return {
      size: totalSize,
      gzipSize,
      parseTime: Math.floor(totalSize / 1000), // Rough estimate
      modules: modules.length
    };
  }

  splitChunk(chunk: ChunkInfo): ChunkInfo[] {
    if (chunk.size <= this.maxChunkSize) {
      return [chunk];
    }

    const chunks: ChunkInfo[] = [];
    let currentChunk: ChunkInfo = {
      name: `${chunk.name}-1`,
      size: 0,
      modules: [],
      isEntry: chunk.isEntry,
      isAsync: chunk.isAsync
    };

    let chunkIndex = 1;

    for (const module of chunk.modules) {
      // Estimate module size (mock)
      const moduleSize = 5000;
      
      if (currentChunk.size + moduleSize > this.maxChunkSize) {
        chunks.push(currentChunk);
        chunkIndex++;
        currentChunk = {
          name: `${chunk.name}-${chunkIndex}`,
          size: 0,
          modules: [],
          isEntry: false,
          isAsync: chunk.isAsync
        };
      }

      currentChunk.modules.push(module);
      currentChunk.size += moduleSize;
    }

    if (currentChunk.modules.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  mergeSmallChunks(chunks: ChunkInfo[]): ChunkInfo[] {
    const result: ChunkInfo[] = [];
    let accumulator: ChunkInfo | null = null;

    for (const chunk of chunks) {
      if (chunk.size < this.minChunkSize && !chunk.isEntry) {
        if (!accumulator) {
          accumulator = {
            name: 'merged',
            size: 0,
            modules: [],
            isEntry: false,
            isAsync: chunk.isAsync
          };
        }
        
        accumulator.modules.push(...chunk.modules);
        accumulator.size += chunk.size;
        
        if (accumulator.size >= this.minChunkSize) {
          result.push(accumulator);
          accumulator = null;
        }
      } else {
        if (accumulator) {
          result.push(accumulator);
          accumulator = null;
        }
        result.push(chunk);
      }
    }

    if (accumulator) {
      result.push(accumulator);
    }

    return result;
  }

  optimizeLoadOrder(chunks: ChunkInfo[]): string[] {
    // Sort by priority: entry chunks first, then by size
    const sorted = [...chunks].sort((a, b) => {
      if (a.isEntry !== b.isEntry) {
        return a.isEntry ? -1 : 1;
      }
      return b.size - a.size;
    });

    return sorted.map(c => c.name);
  }

  calculateCacheability(chunk: ChunkInfo): number {
    // Vendor chunks are highly cacheable
    if (chunk.name.includes('vendor')) return 1.0;
    
    // Common/shared chunks are moderately cacheable
    if (chunk.name.includes('common') || chunk.name.includes('shared')) return 0.7;
    
    // App-specific chunks are less cacheable
    return 0.3;
  }

  recommendPreload(chunks: ChunkInfo[]): string[] {
    return chunks
      .filter(c => c.isEntry || c.name.includes('vendor'))
      .map(c => c.name);
  }

  recommendPrefetch(chunks: ChunkInfo[]): string[] {
    return chunks
      .filter(c => !c.isEntry && c.isAsync)
      .map(c => c.name);
  }
}

describe('BundleOptimizer', () => {
  let optimizer: BundleOptimizer;

  beforeEach(() => {
    optimizer = new BundleOptimizer();
  });

  it('should analyze bundle metrics', () => {
    const modules = [
      { name: 'module1', size: 1000 },
      { name: 'module2', size: 2000 },
      { name: 'module3', size: 3000 }
    ];

    const metrics = optimizer.analyzeBundle(modules);
    
    expect(metrics.size).toBe(6000);
    expect(metrics.gzipSize).toBeLessThan(metrics.size);
    expect(metrics.modules).toBe(3);
  });

  it('should split large chunks', () => {
    const largeChunk: ChunkInfo = {
      name: 'large',
      size: 500000,
      modules: Array(100).fill('module'),
      isEntry: false,
      isAsync: true
    };

    const chunks = optimizer.splitChunk(largeChunk);
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(c => c.size <= 244000)).toBe(true);
  });

  it('should not split small chunks', () => {
    const smallChunk: ChunkInfo = {
      name: 'small',
      size: 50000,
      modules: ['module1', 'module2'],
      isEntry: false,
      isAsync: false
    };

    const chunks = optimizer.splitChunk(smallChunk);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual(smallChunk);
  });

  it('should merge small chunks', () => {
    const smallChunks: ChunkInfo[] = [
      { name: 'tiny1', size: 5000, modules: ['a'], isEntry: false, isAsync: false },
      { name: 'tiny2', size: 5000, modules: ['b'], isEntry: false, isAsync: false },
      { name: 'tiny3', size: 5000, modules: ['c'], isEntry: false, isAsync: false }
    ];

    const merged = optimizer.mergeSmallChunks(smallChunks);
    
    expect(merged.length).toBeLessThan(smallChunks.length);
  });

  it('should optimize load order', () => {
    const chunks: ChunkInfo[] = [
      { name: 'app', size: 50000, modules: [], isEntry: false, isAsync: false },
      { name: 'vendor', size: 100000, modules: [], isEntry: true, isAsync: false },
      { name: 'common', size: 30000, modules: [], isEntry: false, isAsync: true }
    ];

    const order = optimizer.optimizeLoadOrder(chunks);
    
    expect(order[0]).toBe('vendor'); // Entry chunk first
  });

  it('should calculate cacheability', () => {
    const vendorChunk: ChunkInfo = {
      name: 'vendor',
      size: 100000,
      modules: [],
      isEntry: false,
      isAsync: false
    };

    const appChunk: ChunkInfo = {
      name: 'app',
      size: 50000,
      modules: [],
      isEntry: true,
      isAsync: false
    };

    expect(optimizer.calculateCacheability(vendorChunk)).toBe(1.0);
    expect(optimizer.calculateCacheability(appChunk)).toBeLessThan(1.0);
  });

  it('should recommend preload chunks', () => {
    const chunks: ChunkInfo[] = [
      { name: 'vendor', size: 100000, modules: [], isEntry: false, isAsync: false },
      { name: 'app', size: 50000, modules: [], isEntry: true, isAsync: false },
      { name: 'lazy', size: 30000, modules: [], isEntry: false, isAsync: true }
    ];

    const preload = optimizer.recommendPreload(chunks);
    
    expect(preload).toContain('vendor');
    expect(preload).toContain('app');
    expect(preload).not.toContain('lazy');
  });
});
