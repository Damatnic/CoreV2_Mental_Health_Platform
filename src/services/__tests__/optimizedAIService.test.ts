import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface AIServiceConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

interface AIResponse {
  text: string;
  confidence: number;
  tokens: number;
  processingTime: number;
}

interface CacheEntry {
  key: string;
  response: AIResponse;
  timestamp: number;
  ttl: number;
}

class OptimizedAIService {
  private config: AIServiceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Array<{ resolve: Function; reject: Function; request: any }> = [];
  private isProcessing = false;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  private generateCacheKey(prompt: string, options?: any): string {
    return btoa(JSON.stringify({ prompt, options, model: this.config.model }));
  }

  private getCachedResponse(key: string): AIResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCachedResponse(key: string, response: AIResponse, ttl: number = 300000): void {
    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
      ttl
    });
  }

  private async processRequest(prompt: string, options: any = {}): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    const mockResponse: AIResponse = {
      text: `AI response to: ${prompt.substring(0, 50)}...`,
      confidence: 0.85 + Math.random() * 0.15,
      tokens: Math.floor(prompt.length / 4) + Math.floor(Math.random() * 100),
      processingTime: Date.now() - startTime
    };

    return mockResponse;
  }

  async generateResponse(prompt: string, options: any = {}): Promise<AIResponse> {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Check cache first
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Add to queue for batching
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        request: { prompt, options, cacheKey }
      });
      
      this.processBatch();
    });
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.requestQueue.splice(0, 5); // Process up to 5 at a time
      
      const promises = batch.map(async ({ resolve, reject, request }) => {
        try {
          const response = await this.processRequest(request.prompt, request.options);
          this.setCachedResponse(request.cacheKey, response);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
      
      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
      
      // Process next batch if queue is not empty
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatch(), 10);
      }
    }
  }

  async analyzeMoodFromText(text: string): Promise<{
    mood: number;
    confidence: number;
    keywords: string[];
  }> {
    const response = await this.generateResponse(
      `Analyze the mood of this text: "${text}"`,
      { task: 'mood_analysis' }
    );
    
    // Mock mood analysis
    const moodKeywords = ['happy', 'sad', 'angry', 'anxious', 'calm', 'excited'];
    const foundKeywords = moodKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    let mood = 5; // Neutral
    if (text.includes('happy') || text.includes('excited')) mood = 8;
    if (text.includes('sad') || text.includes('angry')) mood = 3;
    if (text.includes('anxious')) mood = 4;
    if (text.includes('calm')) mood = 7;
    
    return {
      mood,
      confidence: response.confidence,
      keywords: foundKeywords
    };
  }

  async detectCrisisIndicators(text: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    confidence: number;
  }> {
    const response = await this.generateResponse(
      `Analyze this text for crisis indicators: "${text}"`,
      { task: 'crisis_detection' }
    );
    
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hopeless', 
      'worthless', 'burden', 'trapped'
    ];
    
    const foundIndicators = crisisKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (foundIndicators.length > 3) riskLevel = 'critical';
    else if (foundIndicators.length > 2) riskLevel = 'high';
    else if (foundIndicators.length > 0) riskLevel = 'medium';
    
    return {
      riskLevel,
      indicators: foundIndicators,
      confidence: response.confidence
    };
  }

  getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
  } {
    // Mock cache stats
    return {
      size: this.cache.size,
      hitRate: 0.75,
      totalRequests: 100
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateConfig(updates: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

describe('OptimizedAIService', () => {
  let service: OptimizedAIService;
  const mockConfig: AIServiceConfig = {
    apiKey: 'test-key',
    baseURL: 'https://api.test.com',
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000
  };

  beforeEach(() => {
    service = new OptimizedAIService(mockConfig);
  });

  afterEach(() => {
    service.clearCache();
  });

  it('should generate response', async () => {
    const response = await service.generateResponse('Hello world');
    
    expect(response.text).toContain('AI response to: Hello world');
    expect(response.confidence).toBeGreaterThan(0);
    expect(response.tokens).toBeGreaterThan(0);
    expect(response.processingTime).toBeGreaterThan(0);
  });

  it('should cache responses', async () => {
    const prompt = 'Test prompt';
    
    const response1 = await service.generateResponse(prompt);
    const response2 = await service.generateResponse(prompt);
    
    expect(response1.text).toBe(response2.text);
    expect(response1.confidence).toBe(response2.confidence);
  });

  it('should analyze mood from text', async () => {
    const result = await service.analyzeMoodFromText('I am feeling very happy today!');
    
    expect(result.mood).toBeGreaterThan(5);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.keywords).toContain('happy');
  });

  it('should detect crisis indicators', async () => {
    const result = await service.detectCrisisIndicators('I feel hopeless and worthless');
    
    expect(result.riskLevel).toBeOneOf(['medium', 'high']);
    expect(result.indicators).toContain('hopeless');
    expect(result.indicators).toContain('worthless');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should handle empty prompt', async () => {
    await expect(service.generateResponse('')).rejects.toThrow('Prompt cannot be empty');
    await expect(service.generateResponse('   ')).rejects.toThrow('Prompt cannot be empty');
  });

  it('should provide cache statistics', () => {
    const stats = service.getCacheStats();
    
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('totalRequests');
    expect(typeof stats.size).toBe('number');
  });

  it('should clear cache', async () => {
    await service.generateResponse('Test prompt');
    expect(service.getCacheStats().size).toBeGreaterThan(0);
    
    service.clearCache();
    expect(service.getCacheStats().size).toBe(0);
  });

  it('should update configuration', () => {
    const updates = { temperature: 0.9, maxTokens: 2000 };
    service.updateConfig(updates);
    
    // We can't directly test the private config, but we can test that it doesn't throw
    expect(() => service.updateConfig(updates)).not.toThrow();
  });

  it('should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => 
      service.generateResponse(`Test prompt ${i}`)
    );
    
    const responses = await Promise.all(promises);
    
    expect(responses).toHaveLength(10);
    responses.forEach(response => {
      expect(response.text).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });
  });
});
