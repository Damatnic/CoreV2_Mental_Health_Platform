/**
 * Journal Entries API Service
 * Handles all journal-related API operations with offline support
 */

import { apiClient, ApiResponse } from './apiClient';
import { offlineStorage, StoreName, DataRecord } from '../../utils/offlineStorage';
import { dataSync } from '../sync/dataSync';

// Journal entry interface
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: number;
  tags: string[];
  category?: 'personal' | 'work' | 'health' | 'relationships' | 'goals' | 'gratitude' | 'other';
  attachments?: Array<{
    id: string;
    type: 'image' | 'audio' | 'video' | 'document';
    url: string;
    thumbnail?: string;
    size: number;
    name: string;
  }>;
  prompts?: Array<{
    question: string;
    response: string;
  }>;
  isPrivate: boolean;
  isFavorite: boolean;
  sentiment?: {
    score: number; // -1 to 1
    magnitude: number;
    emotions: Record<string, number>;
  };
  wordCount: number;
  readingTime: number; // in minutes
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

// Journal statistics interface
export interface JournalStatistics {
  totalEntries: number;
  totalWords: number;
  averageWordCount: number;
  writingStreak: number;
  longestStreak: number;
  favoriteCount: number;
  topTags: Array<{ tag: string; count: number }>;
  categoryCounts: Record<string, number>;
  sentimentTrend: Array<{ date: string; sentiment: number }>;
  writingFrequency: Array<{ date: string; count: number }>;
  monthlyGrowth: number;
}

// Journal prompt interface
export interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  usageCount: number;
  rating?: number;
}

// Filter options for journal queries
export interface JournalFilter {
  startDate?: string;
  endDate?: string;
  tags?: string[];
  category?: string;
  searchQuery?: string;
  isFavorite?: boolean;
  minWordCount?: number;
  maxWordCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'wordCount' | 'sentiment' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Journal Service Class
 */
class JournalService {
  private readonly baseEndpoint = '/journal';

  /**
   * Create a new journal entry
   */
  async createJournalEntry(
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>
  ): Promise<JournalEntry> {
    try {
      // Calculate word count and reading time
      const wordCount = this.calculateWordCount(entry.content);
      const readingTime = this.calculateReadingTime(wordCount);

      // Generate ID and timestamps
      const journalEntry: JournalEntry = {
        ...entry,
        id: this.generateId(),
        wordCount,
        readingTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Analyze sentiment if not provided
      if (!journalEntry.sentiment) {
        journalEntry.sentiment = await this.analyzeSentiment(entry.content);
      }

      // Save to offline storage first (offline-first approach)
      await offlineStorage.put(StoreName.JOURNAL, journalEntry.id, journalEntry, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.post<JournalEntry>(this.baseEndpoint, journalEntry);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.JOURNAL, response.data.id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.JOURNAL, response.data.id, 'synced');
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync journal entry, will retry later:', error);
        }
      }

      // Return local entry if offline or sync failed
      return journalEntry;
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      throw error;
    }
  }

  /**
   * Get all journal entries with optional filtering
   */
  async getJournalEntries(filter?: JournalFilter): Promise<JournalEntry[]> {
    try {
      // Try to fetch from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<JournalEntry[]>(this.baseEndpoint, {
            params: filter,
          });

          if (response.success && response.data) {
            // Update local storage with server data
            for (const entry of response.data) {
              await offlineStorage.put(StoreName.JOURNAL, entry.id, entry, {
                encrypt: true,
              });
            }

            return response.data;
          }
        } catch (error) {
          console.error('Failed to fetch from server, using local data:', error);
        }
      }

      // Fallback to local storage
      const localRecords = await offlineStorage.getAll<JournalEntry>(StoreName.JOURNAL);
      let entries = localRecords.map(record => record.data);

      // Apply local filtering
      if (filter) {
        entries = this.applyLocalFilter(entries, filter);
      }

      return entries;
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      throw error;
    }
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    try {
      // Check local storage first
      const localRecord = await offlineStorage.get<JournalEntry>(StoreName.JOURNAL, id);
      
      if (localRecord) {
        // Update last accessed time
        const updated = {
          ...localRecord.data,
          lastAccessedAt: new Date().toISOString(),
        };
        
        await offlineStorage.put(StoreName.JOURNAL, id, updated, {
          encrypt: true,
        });

        // Try to get updated version from server if online
        if (navigator.onLine) {
          try {
            const response = await apiClient.get<JournalEntry>(`${this.baseEndpoint}/${id}`);
            
            if (response.success && response.data) {
              // Update local storage if server has newer version
              if (new Date(response.data.updatedAt) > new Date(localRecord.data.updatedAt)) {
                await offlineStorage.put(StoreName.JOURNAL, id, response.data, {
                  encrypt: true,
                });
                return response.data;
              }
            }
          } catch (error) {
            console.error('Failed to fetch from server, using local data:', error);
          }
        }
        
        return updated;
      }

      // If not in local storage and online, try server
      if (navigator.onLine) {
        const response = await apiClient.get<JournalEntry>(`${this.baseEndpoint}/${id}`);
        
        if (response.success && response.data) {
          // Store locally for offline access
          await offlineStorage.put(StoreName.JOURNAL, id, response.data, {
            encrypt: true,
          });
          return response.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get journal entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing journal entry
   */
  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    try {
      // Get existing entry
      const existing = await this.getJournalEntry(id);
      
      if (!existing) {
        throw new Error('Journal entry not found');
      }

      // Recalculate word count and reading time if content changed
      let wordCount = existing.wordCount;
      let readingTime = existing.readingTime;
      
      if (updates.content && updates.content !== existing.content) {
        wordCount = this.calculateWordCount(updates.content);
        readingTime = this.calculateReadingTime(wordCount);
      }

      // Merge updates
      const updated: JournalEntry = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        wordCount,
        readingTime,
        updatedAt: new Date().toISOString(),
      };

      // Re-analyze sentiment if content changed
      if (updates.content && updates.content !== existing.content) {
        updated.sentiment = await this.analyzeSentiment(updates.content);
      }

      // Save to offline storage
      await offlineStorage.put(StoreName.JOURNAL, id, updated, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.put<JournalEntry>(`${this.baseEndpoint}/${id}`, updated);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.JOURNAL, id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.JOURNAL, id, 'synced');
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync journal update, will retry later:', error);
        }
      }

      return updated;
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string): Promise<boolean> {
    try {
      // Delete from local storage
      await offlineStorage.delete(StoreName.JOURNAL, id);

      // Try to delete from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.delete(`${this.baseEndpoint}/${id}`);
          return response.success;
        } catch (error) {
          console.error('Failed to delete from server, will retry later:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<JournalEntry> {
    const entry = await this.getJournalEntry(id);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    return this.updateJournalEntry(id, {
      isFavorite: !entry.isFavorite,
    });
  }

  /**
   * Get journal statistics
   */
  async getJournalStatistics(userId: string): Promise<JournalStatistics> {
    try {
      // Try to get from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<JournalStatistics>(`${this.baseEndpoint}/statistics`, {
            params: { userId },
          });

          if (response.success && response.data) {
            return response.data;
          }
        } catch (error) {
          console.error('Failed to fetch statistics from server:', error);
        }
      }

      // Calculate statistics locally
      return await this.calculateLocalStatistics(userId);
    } catch (error) {
      console.error('Failed to get journal statistics:', error);
      throw error;
    }
  }

  /**
   * Get journal prompts
   */
  async getJournalPrompts(category?: string): Promise<JournalPrompt[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<JournalPrompt[]>(`${this.baseEndpoint}/prompts`, {
          params: { category },
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Return default prompts if offline
      return this.getDefaultPrompts(category);
    } catch (error) {
      console.error('Failed to get journal prompts:', error);
      return this.getDefaultPrompts(category);
    }
  }

  /**
   * Search journal entries
   */
  async searchJournalEntries(query: string, userId: string): Promise<JournalEntry[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<JournalEntry[]>(`${this.baseEndpoint}/search`, {
          params: { query, userId },
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Local search fallback
      const entries = await this.getJournalEntries();
      return entries.filter(entry => {
        const searchText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
    } catch (error) {
      console.error('Failed to search journal entries:', error);
      throw error;
    }
  }

  /**
   * Export journal entries
   */
  async exportJournalEntries(
    userId: string,
    format: 'json' | 'pdf' | 'markdown' = 'json',
    filter?: JournalFilter
  ): Promise<Blob> {
    try {
      const entries = await this.getJournalEntries(filter);
      
      switch (format) {
        case 'json':
          const json = JSON.stringify(entries, null, 2);
          return new Blob([json], { type: 'application/json' });
          
        case 'markdown':
          const markdown = this.convertToMarkdown(entries);
          return new Blob([markdown], { type: 'text/markdown' });
          
        case 'pdf':
          // This would require a PDF generation library
          if (navigator.onLine) {
            const response = await apiClient.post(`${this.baseEndpoint}/export/pdf`, {
              entries,
            }, {
              responseType: 'blob',
            });
            
            if (response.success && response.data) {
              return response.data;
            }
          }
          // Fallback to markdown if PDF generation fails
          const fallbackMarkdown = this.convertToMarkdown(entries);
          return new Blob([fallbackMarkdown], { type: 'text/plain' });
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export journal entries:', error);
      throw error;
    }
  }

  /**
   * Bulk import journal entries
   */
  async bulkImportJournalEntries(
    entries: Array<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<JournalEntry[]> {
    const imported: JournalEntry[] = [];

    for (const entry of entries) {
      try {
        const result = await this.createJournalEntry(entry);
        imported.push(result);
      } catch (error) {
        console.error('Failed to import journal entry:', error);
      }
    }

    // Trigger sync
    await dataSync.syncStore(StoreName.JOURNAL);

    return imported;
  }

  /**
   * Get related entries (by tags or content similarity)
   */
  async getRelatedEntries(id: string, limit: number = 5): Promise<JournalEntry[]> {
    try {
      const entry = await this.getJournalEntry(id);
      if (!entry) return [];

      if (navigator.onLine) {
        const response = await apiClient.get<JournalEntry[]>(`${this.baseEndpoint}/${id}/related`, {
          params: { limit },
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Local similarity search based on tags
      const allEntries = await this.getJournalEntries();
      return allEntries
        .filter(e => e.id !== id)
        .map(e => ({
          entry: e,
          score: this.calculateSimilarityScore(entry, e),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.entry);
    } catch (error) {
      console.error('Failed to get related entries:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private generateId(): string {
    return `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(wordCount: number): number {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async analyzeSentiment(content: string): Promise<JournalEntry['sentiment']> {
    // Basic sentiment analysis (would be better with ML service)
    const positiveWords = ['happy', 'joy', 'love', 'grateful', 'excited', 'wonderful', 'amazing'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'depressed', 'anxious', 'worried', 'terrible'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    
    const total = positiveCount + negativeCount || 1;
    const score = (positiveCount - negativeCount) / total;
    
    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude: Math.min(1, total / words.length),
      emotions: {
        joy: positiveCount / total || 0,
        sadness: negativeCount / total || 0,
        neutral: 1 - (positiveCount + negativeCount) / words.length,
      },
    };
  }

  private applyLocalFilter(entries: JournalEntry[], filter: JournalFilter): JournalEntry[] {
    let filtered = [...entries];

    if (filter.startDate) {
      filtered = filtered.filter(e => e.createdAt >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(e => e.createdAt <= filter.endDate!);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(e => 
        filter.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (filter.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const searchText = `${e.title} ${e.content} ${e.tags.join(' ')}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    if (filter.isFavorite !== undefined) {
      filtered = filtered.filter(e => e.isFavorite === filter.isFavorite);
    }

    if (filter.minWordCount !== undefined) {
      filtered = filtered.filter(e => e.wordCount >= filter.minWordCount!);
    }

    if (filter.maxWordCount !== undefined) {
      filtered = filtered.filter(e => e.wordCount <= filter.maxWordCount!);
    }

    if (filter.sentiment) {
      filtered = filtered.filter(e => {
        if (!e.sentiment) return false;
        switch (filter.sentiment) {
          case 'positive':
            return e.sentiment.score > 0.2;
          case 'negative':
            return e.sentiment.score < -0.2;
          case 'neutral':
            return e.sentiment.score >= -0.2 && e.sentiment.score <= 0.2;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sortBy = filter.sortBy || 'date';
    const sortOrder = filter.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'wordCount':
          comparison = a.wordCount - b.wordCount;
          break;
        case 'sentiment':
          comparison = (a.sentiment?.score || 0) - (b.sentiment?.score || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  private async calculateLocalStatistics(userId: string): Promise<JournalStatistics> {
    const entries = await this.getJournalEntries();
    
    // Calculate basic statistics
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    const averageWordCount = totalEntries > 0 ? totalWords / totalEntries : 0;
    const favoriteCount = entries.filter(e => e.isFavorite).length;
    
    // Calculate writing streak
    const writingStreak = this.calculateWritingStreak(entries);
    const longestStreak = this.calculateLongestWritingStreak(entries);
    
    // Calculate top tags
    const tagCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate category counts
    const categoryCounts: Record<string, number> = {};
    entries.forEach(entry => {
      const category = entry.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Calculate sentiment trend
    const sentimentTrend = this.calculateSentimentTrend(entries);
    
    // Calculate writing frequency
    const writingFrequency = this.calculateWritingFrequency(entries);
    
    // Calculate monthly growth
    const monthlyGrowth = this.calculateMonthlyGrowth(entries);
    
    return {
      totalEntries,
      totalWords,
      averageWordCount: Math.round(averageWordCount),
      writingStreak,
      longestStreak,
      favoriteCount,
      topTags,
      categoryCounts,
      sentimentTrend,
      writingFrequency,
      monthlyGrowth,
    };
  }

  private calculateWritingStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateLongestWritingStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i - 1].createdAt);
      const currDate = new Date(sortedEntries[i].createdAt);
      
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (daysDiff > 1) {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  private calculateSentimentTrend(entries: JournalEntry[]): Array<{ date: string; sentiment: number }> {
    const dailySentiments = new Map<string, number[]>();
    
    entries.forEach(entry => {
      if (entry.sentiment) {
        const date = new Date(entry.createdAt).toISOString().split('T')[0];
        if (!dailySentiments.has(date)) {
          dailySentiments.set(date, []);
        }
        dailySentiments.get(date)!.push(entry.sentiment.score);
      }
    });
    
    return Array.from(dailySentiments.entries())
      .map(([date, scores]) => ({
        date,
        sentiment: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private calculateWritingFrequency(entries: JournalEntry[]): Array<{ date: string; count: number }> {
    const dailyCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });
    
    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private calculateMonthlyGrowth(entries: JournalEntry[]): number {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthEntries = entries.filter(e => new Date(e.createdAt) >= thisMonth).length;
    const lastMonthEntries = entries.filter(e => {
      const date = new Date(e.createdAt);
      return date >= lastMonth && date < thisMonth;
    }).length;
    
    if (lastMonthEntries === 0) return thisMonthEntries > 0 ? 100 : 0;
    
    return Math.round(((thisMonthEntries - lastMonthEntries) / lastMonthEntries) * 100);
  }

  private calculateSimilarityScore(entry1: JournalEntry, entry2: JournalEntry): number {
    let score = 0;
    
    // Tag similarity
    const commonTags = entry1.tags.filter(tag => entry2.tags.includes(tag));
    score += commonTags.length * 10;
    
    // Category similarity
    if (entry1.category === entry2.category) {
      score += 5;
    }
    
    // Sentiment similarity
    if (entry1.sentiment && entry2.sentiment) {
      const sentimentDiff = Math.abs(entry1.sentiment.score - entry2.sentiment.score);
      score += Math.max(0, 5 - sentimentDiff * 5);
    }
    
    // Time proximity (entries closer in time are more relevant)
    const timeDiff = Math.abs(
      new Date(entry1.createdAt).getTime() - new Date(entry2.createdAt).getTime()
    );
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysDiff / 3);
    
    return score;
  }

  private convertToMarkdown(entries: JournalEntry[]): string {
    const markdown = entries.map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const time = new Date(entry.createdAt).toLocaleTimeString();
      
      return `# ${entry.title}

**Date:** ${date} ${time}  
**Tags:** ${entry.tags.join(', ')}  
**Category:** ${entry.category || 'Other'}  
**Word Count:** ${entry.wordCount}  
${entry.sentiment ? `**Sentiment:** ${entry.sentiment.score > 0 ? 'Positive' : entry.sentiment.score < 0 ? 'Negative' : 'Neutral'}` : ''}

${entry.content}

${entry.prompts && entry.prompts.length > 0 ? `
## Prompts

${entry.prompts.map(p => `**${p.question}**\n${p.response}`).join('\n\n')}
` : ''}

---
`;
    }).join('\n\n');
    
    return `# Journal Entries

${markdown}`;
  }

  private getDefaultPrompts(category?: string): JournalPrompt[] {
    const prompts: JournalPrompt[] = [
      {
        id: '1',
        category: 'gratitude',
        prompt: 'What are three things you are grateful for today?',
        description: 'Focus on the positive aspects of your day',
        difficulty: 'easy',
        tags: ['gratitude', 'positivity'],
        usageCount: 0,
        rating: 4.5,
      },
      {
        id: '2',
        category: 'reflection',
        prompt: 'What did you learn about yourself today?',
        description: 'Reflect on personal growth and self-discovery',
        difficulty: 'medium',
        tags: ['self-awareness', 'growth'],
        usageCount: 0,
        rating: 4.3,
      },
      {
        id: '3',
        category: 'goals',
        prompt: 'What is one step you took today toward your goals?',
        description: 'Track progress on personal objectives',
        difficulty: 'easy',
        tags: ['goals', 'progress'],
        usageCount: 0,
        rating: 4.4,
      },
      {
        id: '4',
        category: 'emotions',
        prompt: 'Describe how you are feeling right now in detail',
        description: 'Explore and understand your current emotional state',
        difficulty: 'medium',
        tags: ['emotions', 'mindfulness'],
        usageCount: 0,
        rating: 4.6,
      },
      {
        id: '5',
        category: 'relationships',
        prompt: 'How did you connect with others today?',
        description: 'Reflect on social interactions and relationships',
        difficulty: 'easy',
        tags: ['relationships', 'connection'],
        usageCount: 0,
        rating: 4.2,
      },
    ];
    
    if (category) {
      return prompts.filter(p => p.category === category);
    }
    
    return prompts;
  }
}

// Export singleton instance
export const journalService = new JournalService();

// Export types
export type { JournalEntry, JournalStatistics, JournalPrompt, JournalFilter };