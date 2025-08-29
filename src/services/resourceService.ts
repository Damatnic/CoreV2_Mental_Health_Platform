/**
 * Resource Service - Manages mental health resources with professional vetting,
 * version control, quality ratings, and personalized recommendations
 */

// Types and interfaces
export type ResourceCategory = 
  | 'anxiety' 
  | 'depression' 
  | 'stress' 
  | 'mindfulness'
  | 'relationships'
  | 'self-care'
  | 'trauma'
  | 'sleep'
  | 'crisis'
  | 'substance-use'
  | 'eating-disorders'
  | 'grief'
  | 'anger'
  | 'parenting'
  | 'workplace';

export type ResourceType = 
  | 'article' 
  | 'video' 
  | 'worksheet'
  | 'audio'
  | 'infographic'
  | 'tool'
  | 'app'
  | 'book'
  | 'course'
  | 'podcast';

export type ResourceStatus = 
  | 'draft'
  | 'pending-review'
  | 'under-review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'rejected';

export type AccessLevel = 
  | 'public'
  | 'registered'
  | 'premium'
  | 'professional'
  | 'admin';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  status: ResourceStatus;
  accessLevel: AccessLevel;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  content?: string;
  author: string;
  authorId?: string;
  source?: string;
  language: string;
  duration?: string; // For videos/audio
  pageCount?: number; // For PDFs/articles
  fileSize?: number; // In bytes
  format?: string; // PDF, MP4, etc.
  tags: string[];
  rating: number;
  ratingCount: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  isVetted: boolean;
  vettedBy?: string;
  vettedAt?: Date;
  vettingNotes?: string;
  version: number;
  previousVersions?: ResourceVersion[];
  relatedResources?: string[]; // Resource IDs
  prerequisites?: string[]; // Resource IDs
  targetAudience?: string[];
  ageRange?: { min: number; max: number };
  warnings?: string[];
  culturalConsiderations?: string[];
  evidenceLevel?: 'high' | 'moderate' | 'low' | 'emerging';
  citations?: Citation[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  lastReviewedAt?: Date;
  nextReviewDate?: Date;
  expiresAt?: Date;
  copyright?: string;
  license?: string;
  termsOfUse?: string;
}

export interface ResourceVersion {
  version: number;
  title: string;
  description: string;
  content?: string;
  url?: string;
  modifiedBy: string;
  modifiedAt: Date;
  changeNotes: string;
}

export interface Citation {
  authors: string[];
  title: string;
  journal?: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface ResourceFilter {
  category?: ResourceCategory;
  type?: ResourceType;
  status?: ResourceStatus;
  accessLevel?: AccessLevel;
  tags?: string[];
  isVetted?: boolean;
  isPublished?: boolean;
  language?: string;
  minRating?: number;
  searchQuery?: string;
  authorId?: string;
  dateRange?: { start: Date; end: Date };
}

export interface ResourceCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  resources: string[]; // Resource IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceSubmission {
  title: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  url?: string;
  file?: File;
  tags: string[];
  source?: string;
  copyright?: string;
  submittedBy: string;
  submitterEmail: string;
  submitterRole?: string;
  notes?: string;
}

export interface ResourceReview {
  id: string;
  resourceId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  comments: string;
  recommendations?: string[];
  flags?: string[];
  approved: boolean;
  reviewedAt: Date;
}

export interface ResourceAnalytics {
  resourceId: string;
  period: 'day' | 'week' | 'month' | 'year' | 'all-time';
  views: number;
  uniqueViews: number;
  downloads: number;
  shares: number;
  averageTimeSpent: number; // In seconds
  completionRate: number; // Percentage
  ratings: { [key: number]: number }; // Distribution of ratings
  demographics?: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
  referralSources: Record<string, number>;
  deviceTypes: Record<string, number>;
}

export interface QualityMetrics {
  readabilityScore: number; // Flesch-Kincaid or similar
  completeness: number; // 0-100
  accuracy: number; // 0-100
  relevance: number; // 0-100
  accessibility: number; // 0-100
  culturalSensitivity: number; // 0-100
  evidenceQuality: number; // 0-100
  lastAssessed: Date;
  assessedBy: string;
}

class ResourceService {
  private baseUrl = '/api/resources';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private userPreferences = new Map<string, UserResourcePreferences>();

  // Resource CRUD operations
  async getResources(filter?: ResourceFilter): Promise<Resource[]> {
    const cacheKey = `resources-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = this.buildQueryParams(filter);
      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      
      const resources = await response.json();
      this.setCache(cacheKey, resources);
      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return this.getFallbackResources(filter);
    }
  }

  async getResource(id: string): Promise<Resource | null> {
    const cacheKey = `resource-${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) return null;
      
      const resource = await response.json();
      this.setCache(cacheKey, resource);
      return resource;
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  }

  async createResource(resource: Partial<Resource>): Promise<Resource> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource)
      });
      
      if (!response.ok) throw new Error('Failed to create resource');
      const created = await response.json();
      this.clearCache();
      return created;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update resource');
      const updated = await response.json();
      this.clearCache();
      return updated;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  async deleteResource(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete resource');
      this.clearCache();
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  // Version control
  async getResourceVersions(resourceId: string): Promise<ResourceVersion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching resource versions:', error);
      return [];
    }
  }

  async restoreVersion(resourceId: string, version: number): Promise<Resource> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/versions/${version}/restore`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to restore version');
      const restored = await response.json();
      this.clearCache();
      return restored;
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }

  // User interactions
  async trackView(resourceId: string, userId?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${resourceId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timestamp: new Date() })
      });
      
      // Update local cache with incremented view count
      const cacheKey = `resource-${resourceId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        cached.viewCount++;
        this.setCache(cacheKey, cached);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  async trackDownload(resourceId: string, userId?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${resourceId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timestamp: new Date() })
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }

  async rateResource(resourceId: string, userId: string, rating: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rating })
      });
      
      if (!response.ok) throw new Error('Failed to rate resource');
      this.clearCache();
    } catch (error) {
      console.error('Error rating resource:', error);
      throw error;
    }
  }

  // Favorites and collections
  async getUserFavorites(userId: string): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return await response.json();
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  async addFavorite(userId: string, resourceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceId })
      });
      
      if (!response.ok) throw new Error('Failed to add favorite');
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async removeFavorite(userId: string, resourceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/${userId}/${resourceId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove favorite');
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  async getUserCollections(userId: string): Promise<ResourceCollection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch collections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  async createCollection(collection: Partial<ResourceCollection>): Promise<ResourceCollection> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      });
      
      if (!response.ok) throw new Error('Failed to create collection');
      return await response.json();
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async addToCollection(collectionId: string, resourceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId })
      });
      
      if (!response.ok) throw new Error('Failed to add to collection');
    } catch (error) {
      console.error('Error adding to collection:', error);
      throw error;
    }
  }

  // Resource submission and review
  async submitResource(submission: ResourceSubmission): Promise<string> {
    try {
      const formData = new FormData();
      Object.keys(submission).forEach(key => {
        const value = (submission as any)[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to submit resource');
      const result = await response.json();
      return result.submissionId;
    } catch (error) {
      console.error('Error submitting resource:', error);
      throw error;
    }
  }

  async reviewResource(review: ResourceReview): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${review.resourceId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      
      if (!response.ok) throw new Error('Failed to submit review');
      this.clearCache();
    } catch (error) {
      console.error('Error reviewing resource:', error);
      throw error;
    }
  }

  async getPendingReviews(reviewerId: string): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/pending/${reviewerId}`);
      if (!response.ok) throw new Error('Failed to fetch pending reviews');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      return [];
    }
  }

  // Analytics and insights
  async getResourceAnalytics(resourceId: string, period: string = 'month'): Promise<ResourceAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return this.getDefaultAnalytics(resourceId, period as any);
    }
  }

  async getQualityMetrics(resourceId: string): Promise<QualityMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/quality`);
      if (!response.ok) throw new Error('Failed to fetch quality metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  async assessQuality(resourceId: string, metrics: Partial<QualityMetrics>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      
      if (!response.ok) throw new Error('Failed to assess quality');
    } catch (error) {
      console.error('Error assessing quality:', error);
      throw error;
    }
  }

  // Recommendations and personalization
  async getRecommendations(userId: string, limit: number = 10): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${userId}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return this.getDefaultRecommendations(limit);
    }
  }

  async getRelatedResources(resourceId: string, limit: number = 5): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceId}/related?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch related resources');
      return await response.json();
    } catch (error) {
      console.error('Error fetching related resources:', error);
      return [];
    }
  }

  async trackUserPreference(userId: string, preference: UserPreference): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/preferences/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preference)
      });
      
      // Update local preferences
      const prefs = this.userPreferences.get(userId) || this.getDefaultPreferences();
      this.updatePreferences(prefs, preference);
      this.userPreferences.set(userId, prefs);
    } catch (error) {
      console.error('Error tracking preference:', error);
    }
  }

  // Search and discovery
  async searchResources(query: string, filters?: ResourceFilter): Promise<Resource[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      if (!response.ok) throw new Error('Failed to search resources');
      return await response.json();
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  }

  async getTrendingResources(limit: number = 10): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trending?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch trending resources');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending resources:', error);
      return [];
    }
  }

  async getNewResources(limit: number = 10): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/new?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch new resources');
      return await response.json();
    } catch (error) {
      console.error('Error fetching new resources:', error);
      return [];
    }
  }

  // Utility methods
  private buildQueryParams(filter?: ResourceFilter): string {
    if (!filter) return '';
    
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    return params.toString();
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Fallback data for offline/error scenarios
  private getFallbackResources(filter?: ResourceFilter): Resource[] {
    const fallbackResources: Resource[] = [
      {
        id: 'crisis-1',
        title: 'Crisis Support Resources',
        description: 'Immediate help and support during mental health crises',
        category: 'crisis',
        type: 'article',
        status: 'published',
        accessLevel: 'public',
        url: '/resources/crisis-support',
        author: 'Mental Health Team',
        source: 'Internal',
        language: 'en',
        tags: ['crisis', 'emergency', 'support', 'help'],
        rating: 4.8,
        ratingCount: 245,
        viewCount: 15420,
        downloadCount: 3201,
        shareCount: 892,
        isVetted: true,
        vettedBy: 'Dr. Sarah Johnson',
        vettedAt: new Date('2024-01-15'),
        version: 2,
        relatedResources: ['crisis-2', 'crisis-3'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        publishedAt: new Date('2024-01-02')
      },
      {
        id: 'mindfulness-1',
        title: 'Introduction to Mindfulness Meditation',
        description: 'Learn the basics of mindfulness meditation for stress reduction',
        category: 'mindfulness',
        type: 'video',
        status: 'published',
        accessLevel: 'public',
        url: '/resources/mindfulness-intro',
        thumbnailUrl: '/images/mindfulness-thumb.jpg',
        author: 'Mindfulness Center',
        language: 'en',
        duration: '15:30',
        tags: ['mindfulness', 'meditation', 'stress', 'relaxation'],
        rating: 4.6,
        ratingCount: 189,
        viewCount: 8932,
        downloadCount: 1245,
        shareCount: 456,
        isVetted: true,
        vettedBy: 'Dr. Michael Chen',
        vettedAt: new Date('2024-01-10'),
        version: 1,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-10'),
        publishedAt: new Date('2024-01-06')
      },
      {
        id: 'anxiety-worksheet-1',
        title: 'Anxiety Management Worksheet',
        description: 'Practical exercises for managing anxiety symptoms',
        category: 'anxiety',
        type: 'worksheet',
        status: 'published',
        accessLevel: 'registered',
        downloadUrl: '/downloads/anxiety-worksheet.pdf',
        author: 'Clinical Psychology Team',
        language: 'en',
        pageCount: 8,
        fileSize: 2458000,
        format: 'PDF',
        tags: ['anxiety', 'worksheet', 'exercises', 'coping'],
        rating: 4.7,
        ratingCount: 312,
        viewCount: 12450,
        downloadCount: 4532,
        shareCount: 678,
        isVetted: true,
        vettedBy: 'Dr. Emily Rodriguez',
        vettedAt: new Date('2024-01-08'),
        version: 3,
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-08'),
        publishedAt: new Date('2023-12-20')
      }
    ];

    // Apply filters if provided
    let filtered = [...fallbackResources];
    
    if (filter?.category) {
      filtered = filtered.filter(r => r.category === filter.category);
    }
    
    if (filter?.type) {
      filtered = filtered.filter(r => r.type === filter.type);
    }
    
    if (filter?.isVetted !== undefined) {
      filtered = filtered.filter(r => r.isVetted === filter.isVetted);
    }
    
    return filtered;
  }

  private getDefaultAnalytics(resourceId: string, period: ResourceAnalytics['period']): ResourceAnalytics {
    return {
      resourceId,
      period,
      views: 0,
      uniqueViews: 0,
      downloads: 0,
      shares: 0,
      averageTimeSpent: 0,
      completionRate: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      referralSources: {},
      deviceTypes: {}
    };
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      readabilityScore: 0,
      completeness: 0,
      accuracy: 0,
      relevance: 0,
      accessibility: 0,
      culturalSensitivity: 0,
      evidenceQuality: 0,
      lastAssessed: new Date(),
      assessedBy: 'system'
    };
  }

  private getDefaultRecommendations(limit: number): Resource[] {
    return this.getFallbackResources().slice(0, limit);
  }

  private getDefaultPreferences(): UserResourcePreferences {
    return {
      categories: [],
      types: [],
      languages: ['en'],
      accessibility: {
        largeText: false,
        highContrast: false,
        screenReader: false
      },
      notifications: {
        newResources: true,
        updates: true,
        recommendations: true
      }
    };
  }

  private updatePreferences(prefs: UserResourcePreferences, preference: UserPreference): void {
    if (preference.type === 'category' && preference.value) {
      if (!prefs.categories.includes(preference.value as ResourceCategory)) {
        prefs.categories.push(preference.value as ResourceCategory);
      }
    } else if (preference.type === 'type' && preference.value) {
      if (!prefs.types.includes(preference.value as ResourceType)) {
        prefs.types.push(preference.value as ResourceType);
      }
    }
  }
}

// Supporting interfaces
interface UserResourcePreferences {
  categories: ResourceCategory[];
  types: ResourceType[];
  languages: string[];
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
  notifications: {
    newResources: boolean;
    updates: boolean;
    recommendations: boolean;
  };
}

interface UserPreference {
  type: 'category' | 'type' | 'language' | 'accessibility' | 'notification';
  value: any;
  action: 'add' | 'remove' | 'set';
}

// Export singleton instance
export const resourceService = new ResourceService();