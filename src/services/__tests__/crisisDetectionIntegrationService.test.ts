import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface CrisisAlert {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

class CrisisDetectionIntegrationService {
  private activeAlerts: Map<string, CrisisAlert> = new Map();
  private listeners: Set<(alerts: CrisisAlert[]) => void> = new Set();

  async processInput(text: string): Promise<CrisisAlert | null> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (text.toLowerCase().includes('crisis')) {
      const alert: CrisisAlert = {
        id: Date.now().toString(),
        level: 'high',
        message: 'Crisis indicators detected',
        timestamp: new Date(),
        resolved: false
      };
      
      this.activeAlerts.set(alert.id, alert);
      this.notifyListeners();
      return alert;
    }
    
    return null;
  }

  getActiveAlerts(): CrisisAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  subscribe(listener: (alerts: CrisisAlert[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const activeAlerts = this.getActiveAlerts();
    this.listeners.forEach(listener => listener(activeAlerts));
  }
}

describe('CrisisDetectionIntegrationService', () => {
  let service: CrisisDetectionIntegrationService;

  beforeEach(() => {
    service = new CrisisDetectionIntegrationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create alert for crisis text', async () => {
    const alert = await service.processInput('I am in crisis');
    
    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('high');
    expect(service.getActiveAlerts()).toHaveLength(1);
  });

  it('should not create alert for normal text', async () => {
    const alert = await service.processInput('I am feeling good');
    
    expect(alert).toBeNull();
    expect(service.getActiveAlerts()).toHaveLength(0);
  });

  it('should resolve alerts', async () => {
    const alert = await service.processInput('I am in crisis');
    expect(service.getActiveAlerts()).toHaveLength(1);
    
    const resolved = service.resolveAlert(alert!.id);
    expect(resolved).toBe(true);
    expect(service.getActiveAlerts()).toHaveLength(0);
  });

  it('should notify listeners of alert changes', async () => {
    const listener = jest.fn();
    service.subscribe(listener);
    
    await service.processInput('I am in crisis');
    
    expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ level: 'high' })
    ]));
  });
});
