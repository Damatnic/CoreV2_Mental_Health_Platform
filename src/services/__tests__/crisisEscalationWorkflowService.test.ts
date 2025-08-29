import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface EscalationLevel {
  level: number;
  name: string;
  actions: string[];
  notifications: string[];
  timeout: number;
}

interface EscalationWorkflow {
  id: string;
  triggeredBy: string;
  currentLevel: number;
  startedAt: Date;
  status: 'active' | 'resolved' | 'escalated';
  history: EscalationLevel[];
}

class CrisisEscalationWorkflowService {
  private workflows: Map<string, EscalationWorkflow> = new Map();
  
  private escalationLevels: EscalationLevel[] = [
    {
      level: 1,
      name: 'Self-Help Resources',
      actions: ['Show coping strategies', 'Suggest breathing exercises'],
      notifications: [],
      timeout: 300000 // 5 minutes
    },
    {
      level: 2,
      name: 'Peer Support',
      actions: ['Connect with peer counselor', 'Join support group'],
      notifications: ['Notify peer support team'],
      timeout: 600000 // 10 minutes
    },
    {
      level: 3,
      name: 'Professional Support',
      actions: ['Schedule urgent therapy session', 'Connect with counselor'],
      notifications: ['Alert therapist', 'Send notification to care team'],
      timeout: 900000 // 15 minutes
    },
    {
      level: 4,
      name: 'Emergency Response',
      actions: ['Contact crisis hotline', 'Initiate emergency protocol'],
      notifications: ['Alert emergency contacts', 'Notify crisis team'],
      timeout: 0 // Immediate
    }
  ];

  async initiateWorkflow(userId: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<EscalationWorkflow> {
    const initialLevel = this.getInitialLevel(severity);
    
    const workflow: EscalationWorkflow = {
      id: this.generateId(),
      triggeredBy: userId,
      currentLevel: initialLevel.level,
      startedAt: new Date(),
      status: 'active',
      history: [initialLevel]
    };

    this.workflows.set(workflow.id, workflow);
    
    // Execute initial actions
    await this.executeActions(initialLevel);
    
    // Set timeout for escalation
    if (initialLevel.timeout > 0) {
      setTimeout(() => {
        this.checkEscalation(workflow.id);
      }, initialLevel.timeout);
    }

    return workflow;
  }

  async escalate(workflowId: string): Promise<EscalationWorkflow | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status !== 'active') {
      return null;
    }

    const nextLevel = this.escalationLevels.find(
      level => level.level === workflow.currentLevel + 1
    );

    if (!nextLevel) {
      workflow.status = 'escalated';
      return workflow;
    }

    workflow.currentLevel = nextLevel.level;
    workflow.history.push(nextLevel);
    
    await this.executeActions(nextLevel);
    await this.sendNotifications(nextLevel);

    if (nextLevel.timeout > 0) {
      setTimeout(() => {
        this.checkEscalation(workflowId);
      }, nextLevel.timeout);
    }

    return workflow;
  }

  async resolve(workflowId: string, resolution?: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.status = 'resolved';
    
    // Log resolution
    console.log(`Workflow ${workflowId} resolved:`, resolution);
    
    return true;
  }

  private getInitialLevel(severity: string): EscalationLevel {
    switch (severity) {
      case 'critical':
        return this.escalationLevels[3]; // Emergency
      case 'high':
        return this.escalationLevels[2]; // Professional
      case 'medium':
        return this.escalationLevels[1]; // Peer Support
      default:
        return this.escalationLevels[0]; // Self-Help
    }
  }

  private async executeActions(level: EscalationLevel): Promise<void> {
    for (const action of level.actions) {
      console.log(`Executing action: ${action}`);
      // Mock action execution
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async sendNotifications(level: EscalationLevel): Promise<void> {
    for (const notification of level.notifications) {
      console.log(`Sending notification: ${notification}`);
      // Mock notification sending
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private checkEscalation(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow?.status === 'active') {
      this.escalate(workflowId);
    }
  }

  private generateId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getWorkflow(workflowId: string): EscalationWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getActiveWorkflows(): EscalationWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.status === 'active');
  }
}

describe('CrisisEscalationWorkflowService', () => {
  let service: CrisisEscalationWorkflowService;

  beforeEach(() => {
    service = new CrisisEscalationWorkflowService();
    jest.clearAllMocks();
  });

  it('should initiate workflow based on severity', async () => {
    const workflow = await service.initiateWorkflow('user123', 'medium');
    
    expect(workflow).toBeDefined();
    expect(workflow.currentLevel).toBe(2); // Peer Support
    expect(workflow.status).toBe('active');
  });

  it('should start at emergency level for critical severity', async () => {
    const workflow = await service.initiateWorkflow('user123', 'critical');
    
    expect(workflow.currentLevel).toBe(4); // Emergency Response
  });

  it('should escalate workflow', async () => {
    const workflow = await service.initiateWorkflow('user123', 'low');
    const escalated = await service.escalate(workflow.id);
    
    expect(escalated?.currentLevel).toBe(2);
    expect(escalated?.history).toHaveLength(2);
  });

  it('should not escalate resolved workflow', async () => {
    const workflow = await service.initiateWorkflow('user123', 'low');
    await service.resolve(workflow.id);
    
    const result = await service.escalate(workflow.id);
    expect(result).toBeNull();
  });

  it('should resolve workflow', async () => {
    const workflow = await service.initiateWorkflow('user123', 'medium');
    const resolved = await service.resolve(workflow.id, 'User received help');
    
    expect(resolved).toBe(true);
    expect(service.getWorkflow(workflow.id)?.status).toBe('resolved');
  });

  it('should get active workflows', async () => {
    await service.initiateWorkflow('user1', 'low');
    await service.initiateWorkflow('user2', 'medium');
    const workflow3 = await service.initiateWorkflow('user3', 'high');
    await service.resolve(workflow3.id);
    
    const active = service.getActiveWorkflows();
    expect(active).toHaveLength(2);
  });

  it('should handle workflow timeout escalation', async () => {
    jest.useFakeTimers();
    
    const workflow = await service.initiateWorkflow('user123', 'low');
    expect(workflow.currentLevel).toBe(1);
    
    // Fast-forward time
    jest.advanceTimersByTime(300000); // 5 minutes
    
    // Check escalation occurred
    const updated = service.getWorkflow(workflow.id);
    expect(updated?.currentLevel).toBeGreaterThan(1);
    
    jest.useRealTimers();
  });

  it('should track workflow history', async () => {
    const workflow = await service.initiateWorkflow('user123', 'low');
    await service.escalate(workflow.id);
    await service.escalate(workflow.id);
    
    const final = service.getWorkflow(workflow.id);
    expect(final?.history).toHaveLength(3);
    expect(final?.history[0].level).toBe(1);
    expect(final?.history[2].level).toBe(3);
  });
});
