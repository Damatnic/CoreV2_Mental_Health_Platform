/**
 * Offline Service
 * Manages offline functionality for the mental health platform
 */

import { logger } from '../utils/logger';

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: "distraction" | "self-soothe" | "emotional-release" | "mindfulness" | "social";
  steps: string[];
  duration?: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface OfflineResource {
  id: string;
  type: "article" | "video" | "audio" | "exercise";
  title: string;
  content: string;
  category: string;
  lastUpdated: Date;
  size: number;
}

export interface OfflineData {
  copingStrategies: CopingStrategy[];
  resources: OfflineResource[];
  userProgress: Record<string, any>;
  lastSync: Date;
}

class OfflineService {
  private readonly STORAGE_KEY = 'corev2_offline_data';
  private readonly CACHE_NAME = 'corev2-offline-cache';
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initializeOfflineSupport();
    this.setupEventListeners();
  }

  private initializeOfflineSupport(): void {
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
    this.initializeOfflineData();
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service Worker registered successfully', { scope: registration.scope });
    } catch (error) {
      logger.error('Service Worker registration failed', { error });
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  private handleOnline(): void {
    logger.info('Connection restored - syncing offline data');
    this.syncOfflineData();
  }

  private handleOffline(): void {
    logger.info('Connection lost - switching to offline mode');
    this.showOfflineNotification();
  }

  private showOfflineNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('You are now offline', {
        body: 'You can still access your saved resources and coping strategies.',
        icon: '/icon-192.png'
      });
    }
  }

  private initializeOfflineData(): void {
    const existingData = this.getOfflineData();
    if (!existingData) {
      const initialData: OfflineData = {
        copingStrategies: this.getDefaultCopingStrategies(),
        resources: [],
        userProgress: {},
        lastSync: new Date()
      };
      this.saveOfflineData(initialData);
    }
  }

  private getDefaultCopingStrategies(): CopingStrategy[] {
    return [
      {
        id: 'breathing-exercise',
        title: '4-7-8 Breathing Exercise',
        description: 'A simple breathing technique to reduce anxiety and promote calm',
        category: 'mindfulness',
        steps: [
          'Sit comfortably with your back straight',
          'Inhale through your nose for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale through your mouth for 8 counts',
          'Repeat 3-4 times'
        ],
        duration: 5,
        difficulty: 'easy',
        tags: ['anxiety', 'breathing', 'quick']
      },
      {
        id: 'grounding-5-4-3-2-1',
        title: '5-4-3-2-1 Grounding Technique',
        description: 'Use your senses to ground yourself in the present moment',
        category: 'mindfulness',
        steps: [
          'Look around and name 5 things you can see',
          'Notice 4 things you can touch',
          'Listen for 3 things you can hear',
          'Identify 2 things you can smell',
          'Think of 1 thing you can taste'
        ],
        duration: 10,
        difficulty: 'easy',
        tags: ['grounding', 'anxiety', 'mindfulness']
      }
    ];
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }

  public getOfflineData(): OfflineData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to retrieve offline data', { error });
      return null;
    }
  }

  public saveOfflineData(data: OfflineData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      logger.info('Offline data saved successfully');
    } catch (error) {
      logger.error('Failed to save offline data', { error });
    }
  }

  public getCopingStrategies(): CopingStrategy[] {
    const data = this.getOfflineData();
    return data?.copingStrategies || [];
  }

  public addCopingStrategy(strategy: CopingStrategy): void {
    const data = this.getOfflineData();
    if (data) {
      data.copingStrategies.push(strategy);
      this.saveOfflineData(data);
    }
  }

  public getOfflineResources(): OfflineResource[] {
    const data = this.getOfflineData();
    return data?.resources || [];
  }

  public addOfflineResource(resource: OfflineResource): void {
    const data = this.getOfflineData();
    if (data) {
      data.resources.push(resource);
      this.saveOfflineData(data);
    }
  }

  public updateUserProgress(key: string, value: any): void {
    const data = this.getOfflineData();
    if (data) {
      data.userProgress[key] = value;
      this.saveOfflineData(data);
    }
  }

  public getUserProgress(key: string): any {
    const data = this.getOfflineData();
    return data?.userProgress[key];
  }

  private async syncOfflineData(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const data = this.getOfflineData();
      if (data) {
        data.lastSync = new Date();
        this.saveOfflineData(data);
      }
      logger.info('Offline data synced successfully');
    } catch (error) {
      logger.error('Failed to sync offline data', { error });
    }
  }

  public clearOfflineData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      logger.info('Offline data cleared');
    } catch (error) {
      logger.error('Failed to clear offline data', { error });
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
