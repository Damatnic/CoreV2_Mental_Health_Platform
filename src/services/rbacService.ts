/**
 * Role-Based Access Control (RBAC) Service
 *
 * Provides comprehensive role-based access control for the mental health platform
 * with hierarchical permissions, resource-based access control, and audit logging.
 * Supports fine-grained permissions for crisis intervention, therapy sessions,
 * and administrative functions while maintaining HIPAA compliance.
 *
 * @fileoverview RBAC service with hierarchical permissions and audit logging
 * @version 2.0.0
 */

import React from 'react';
import { logger } from '../utils/logger';
import { secureStorage } from './secureStorageService';

export type UserRole = 
  | 'patient'
  | 'helper'
  | 'therapist'
  | 'crisis-counselor'
  | 'supervisor'
  | 'admin'
  | 'system-admin';

export type Permission = 
  // Profile permissions
  | 'profile:view'
  | 'profile:edit'
  | 'profile:delete'
  
  // Content permissions
  | 'content:view'
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  | 'content:publish'
  
  // Chat permissions
  | 'chat:view'
  | 'chat:send'
  | 'chat:moderate'
  | 'chat:delete-message'
  
  // Assessment permissions
  | 'assessment:view'
  | 'assessment:take'
  | 'assessment:create'
  | 'assessment:view-all'
  | 'assessment:manage'
  
  // Crisis permissions
  | 'crisis:view'
  | 'crisis:respond'
  | 'crisis:escalate'
  | 'crisis:manage'
  
  // Helper permissions
  | 'helper:view-requests'
  | 'helper:accept-requests'
  | 'helper:view-profile'
  
  // Therapy permissions
  | 'therapy:schedule'
  | 'therapy:conduct'
  | 'therapy:view-sessions'
  | 'therapy:manage'
  
  // Admin permissions
  | 'admin:users'
  | 'admin:content'
  | 'admin:reports'
  | 'admin:system'
  | 'admin:audit';

export type Resource = 
  | 'profile'
  | 'content'
  | 'chat'
  | 'assessment'
  | 'crisis'
  | 'therapy'
  | 'user-management'
  | 'system';

export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: UserRole[];
  level: number; // Hierarchy level (0 = lowest, 5 = highest)
}

export interface AccessContext {
  userId: string;
  resourceId?: string;
  resourceType: Resource;
  action: Permission;
  metadata?: Record<string, any>;
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userRole: UserRole;
  action: Permission;
  resource: Resource;
  resourceId?: string;
  granted: boolean;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

class RBACService {
  private roleDefinitions: Map<UserRole, RoleDefinition> = new Map();
  private userRoles: Map<string, UserRole> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private readonly AUDIT_STORAGE_KEY = 'rbac_audit_log';
  private readonly USER_ROLES_STORAGE_KEY = 'rbac_user_roles';

  constructor() {
    this.initializeRoleDefinitions();
    this.loadPersistedData();
    logger.info('RBACService initialized with role-based access control');
  }

  private initializeRoleDefinitions() {
    // Patient role - basic access
    this.roleDefinitions.set('patient', {
      role: 'patient',
      name: 'Patient',
      description: 'Standard patient with access to personal mental health resources',
      level: 0,
      permissions: [
        'profile:view',
        'profile:edit',
        'content:view',
        'chat:view',
        'chat:send',
        'assessment:view',
        'assessment:take',
        'crisis:view',
      ]
    });

    // Helper role - peer support
    this.roleDefinitions.set('helper', {
      role: 'helper',
      name: 'Peer Helper',
      description: 'Trained peer supporter who can assist other patients',
      level: 1,
      inherits: ['patient'],
      permissions: [
        'helper:view-requests',
        'helper:accept-requests',
        'helper:view-profile',
        'chat:moderate',
        'content:create',
      ]
    });

    // Therapist role - professional therapy
    this.roleDefinitions.set('therapist', {
      role: 'therapist',
      name: 'Licensed Therapist',
      description: 'Licensed mental health professional',
      level: 2,
      inherits: ['helper'],
      permissions: [
        'therapy:schedule',
        'therapy:conduct',
        'therapy:view-sessions',
        'assessment:create',
        'assessment:view-all',
        'crisis:respond',
      ]
    });

    // Crisis counselor role - emergency response
    this.roleDefinitions.set('crisis-counselor', {
      role: 'crisis-counselor',
      name: 'Crisis Counselor',
      description: 'Specialized crisis intervention specialist',
      level: 2,
      inherits: ['therapist'],
      permissions: [
        'crisis:respond',
        'crisis:escalate',
        'crisis:manage',
        'chat:delete-message',
      ]
    });

    // Supervisor role - oversight
    this.roleDefinitions.set('supervisor', {
      role: 'supervisor',
      name: 'Clinical Supervisor',
      description: 'Supervises therapists and crisis counselors',
      level: 3,
      inherits: ['crisis-counselor'],
      permissions: [
        'therapy:manage',
        'assessment:manage',
        'admin:reports',
      ]
    });

    // Admin role - platform administration
    this.roleDefinitions.set('admin', {
      role: 'admin',
      name: 'Platform Administrator',
      description: 'Manages platform users and content',
      level: 4,
      inherits: ['supervisor'],
      permissions: [
        'admin:users',
        'admin:content',
        'admin:reports',
        'content:publish',
        'content:delete',
        'profile:delete',
      ]
    });

    // System admin role - full access
    this.roleDefinitions.set('system-admin', {
      role: 'system-admin',
      name: 'System Administrator',
      description: 'Full system access for technical administration',
      level: 5,
      inherits: ['admin'],
      permissions: [
        'admin:system',
        'admin:audit',
      ]
    });

    logger.debug('Role definitions initialized with hierarchical permissions');
  }

  private async loadPersistedData() {
    try {
      // Load user roles
      const userRoles = await secureStorage.getItem<Record<string, UserRole>>(this.USER_ROLES_STORAGE_KEY);
      if (userRoles) {
        Object.entries(userRoles).forEach(([userId, role]) => {
          this.userRoles.set(userId, role as UserRole);
        });
      }

      // Load audit log
      const auditLog = await secureStorage.getItem<AuditLogEntry[]>(this.AUDIT_STORAGE_KEY);
      if (auditLog && Array.isArray(auditLog)) {
        this.auditLog = auditLog.slice(-1000); // Keep last 1000 entries
      }

      logger.debug(`Loaded ${this.userRoles.size} user roles and ${this.auditLog.length} audit entries`);
    } catch (error) {
      logger.error('Failed to load RBAC persisted data:', error);
    }
  }

  public async assignRole(userId: string, role: UserRole): Promise<boolean> {
    if (!this.roleDefinitions.has(role)) {
      logger.warn(`Attempted to assign invalid role: ${role}`);
      return false;
    }

    this.userRoles.set(userId, role);
    await this.persistUserRoles();
    
    await this.logAccess({
      userId: 'system',
      userRole: 'system-admin',
      action: 'admin:users',
      resource: 'user-management',
      resourceId: userId,
      granted: true,
      timestamp: Date.now(),
      metadata: { assignedRole: role }
    });

    logger.info(`Assigned role ${role} to user ${userId}`);
    return true;
  }

  public getUserRole(userId: string): UserRole | null {
    return this.userRoles.get(userId) || null;
  }

  public getAllPermissions(role: UserRole): Permission[] {
    const roleDefinition = this.roleDefinitions.get(role);
    if (!roleDefinition) {
      return [];
    }

    const permissions = new Set<Permission>(roleDefinition.permissions);

    // Add inherited permissions
    if (roleDefinition.inherits) {
      for (const inheritedRole of roleDefinition.inherits) {
        const inheritedPermissions = this.getAllPermissions(inheritedRole);
        inheritedPermissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  public hasPermission(userId: string, permission: Permission): boolean {
    const userRole = this.getUserRole(userId);
    if (!userRole) {
      return false;
    }

    const userPermissions = this.getAllPermissions(userRole);
    return userPermissions.includes(permission);
  }

  public async checkAccess(context: AccessContext): Promise<AccessResult> {
    const { userId, action, resourceType } = context;
    const userRole = this.getUserRole(userId);

    if (!userRole) {
      await this.logAccess({
        userId,
        userRole: 'patient', // Default for logging
        action,
        resource: resourceType,
        resourceId: context.resourceId,
        granted: false,
        timestamp: Date.now(),
        metadata: { reason: 'No role assigned' }
      });

      return {
        granted: false,
        reason: 'User has no assigned role',
      };
    }

    const hasPermission = this.hasPermission(userId, action);
    
    // Additional resource-specific checks
    const resourceCheck = await this.checkResourceAccess(context, userRole);
    const granted = hasPermission && resourceCheck.granted;

    await this.logAccess({
      userId,
      userRole,
      action,
      resource: resourceType,
      resourceId: context.resourceId,
      granted,
      timestamp: Date.now(),
      metadata: context.metadata
    });

    return {
      granted,
      reason: granted ? undefined : (resourceCheck.reason || 'Insufficient permissions'),
      requiredPermission: hasPermission ? undefined : action,
      requiredRole: this.getMinimumRoleForPermission(action),
    };
  }

  private async checkResourceAccess(context: AccessContext, userRole: UserRole): Promise<AccessResult> {
    const { resourceType, resourceId, userId } = context;

    // Resource-specific access logic
    switch (resourceType) {
      case 'profile':
        // Users can only access their own profile unless they're admin+
        if (resourceId && resourceId !== userId) {
          const roleLevel = this.roleDefinitions.get(userRole)?.level || 0;
          if (roleLevel < 4) { // Less than admin
            return { granted: false, reason: 'Can only access own profile' };
          }
        }
        break;

      case 'therapy':
        // Only therapists and above can conduct therapy
        if (context.action === 'therapy:conduct') {
          const roleLevel = this.roleDefinitions.get(userRole)?.level || 0;
          if (roleLevel < 2) {
            return { granted: false, reason: 'Requires therapist role or higher' };
          }
        }
        break;

      case 'crisis':
        // Crisis actions require appropriate training level
        if (context.action === 'crisis:manage') {
          const roleLevel = this.roleDefinitions.get(userRole)?.level || 0;
          if (roleLevel < 2) {
            return { granted: false, reason: 'Requires crisis counselor role or higher' };
          }
        }
        break;
    }

    return { granted: true };
  }

  private getMinimumRoleForPermission(permission: Permission): UserRole | undefined {
    for (const [role, definition] of Array.from(this.roleDefinitions)) {
      const allPermissions = this.getAllPermissions(role);
      if (allPermissions.includes(permission)) {
        return role;
      }
    }
    return undefined;
  }

  private async logAccess(entry: Omit<AuditLogEntry, 'id'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: this.generateAuditId(),
    };

    this.auditLog.push(auditEntry);
    
    // Keep only last 1000 entries to prevent unlimited growth
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    await this.persistAuditLog();
  }

  public getAuditLog(userId?: string, limit: number = 100): AuditLogEntry[] {
    let logs = [...this.auditLog];
    
    if (userId) {
      logs = logs.filter(entry => entry.userId === userId);
    }
    
    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getRoleDefinition(role: UserRole): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  public getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values())
      .sort((a, b) => a.level - b.level);
  }

  public isHigherRole(role1: UserRole, role2: UserRole): boolean {
    const level1 = this.roleDefinitions.get(role1)?.level || 0;
    const level2 = this.roleDefinitions.get(role2)?.level || 0;
    return level1 > level2;
  }

  public canManageUser(managerId: string, targetUserId: string): boolean {
    const managerRole = this.getUserRole(managerId);
    const targetRole = this.getUserRole(targetUserId);
    
    if (!managerRole || !targetRole) {
      return false;
    }

    // System admins can manage anyone
    if (managerRole === 'system-admin') {
      return true;
    }

    // Admins can manage non-admins
    if (managerRole === 'admin' && targetRole !== 'system-admin' && targetRole !== 'admin') {
      return true;
    }

    // Supervisors can manage therapists and below
    if (managerRole === 'supervisor') {
      const targetLevel = this.roleDefinitions.get(targetRole)?.level || 0;
      return targetLevel <= 2;
    }

    return false;
  }

  private async persistUserRoles(): Promise<void> {
    const userRolesObject = Object.fromEntries(this.userRoles.entries());
    await secureStorage.setItem(this.USER_ROLES_STORAGE_KEY, userRolesObject);
  }

  private async persistAuditLog(): Promise<void> {
    await secureStorage.setItem(this.AUDIT_STORAGE_KEY, this.auditLog);
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async exportAuditLog(): Promise<AuditLogEntry[]> {
    return [...this.auditLog];
  }

  public async clearAuditLog(): Promise<void> {
    this.auditLog = [];
    await this.persistAuditLog();
    logger.info('Audit log cleared');
  }

  public getSecurityMetrics(): {
    totalUsers: number;
    roleDistribution: Record<UserRole, number>;
    recentAccessAttempts: number;
    deniedAccessAttempts: number;
    lastAuditEntry?: AuditLogEntry;
  } {
    const roleDistribution = {} as Record<UserRole, number>;
    
    // Initialize all roles with 0
    for (const role of Array.from(this.roleDefinitions.keys())) {
      roleDistribution[role] = 0;
    }
    
    // Count actual role assignments
    for (const role of Array.from(this.userRoles.values())) {
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    const recentHour = Date.now() - (60 * 60 * 1000);
    const recentAttempts = this.auditLog.filter(entry => entry.timestamp > recentHour);
    const deniedAttempts = recentAttempts.filter(entry => !entry.granted);

    return {
      totalUsers: this.userRoles.size,
      roleDistribution,
      recentAccessAttempts: recentAttempts.length,
      deniedAccessAttempts: deniedAttempts.length,
      lastAuditEntry: this.auditLog[this.auditLog.length - 1],
    };
  }
}

export const rbacService = new RBACService();

// React Hook for RBAC
export const useRBAC = (userId: string) => {
  const userRole = React.useMemo(() => rbacService.getUserRole(userId), [userId]);
  
  const hasPermission = React.useCallback((permission: Permission) => {
    return rbacService.hasPermission(userId, permission);
  }, [userId]);

  const checkAccess = React.useCallback((context: Omit<AccessContext, 'userId'>) => {
    return rbacService.checkAccess({ ...context, userId });
  }, [userId]);

  const canManage = React.useCallback((targetUserId: string) => {
    return rbacService.canManageUser(userId, targetUserId);
  }, [userId]);

  return {
    userRole,
    hasPermission,
    checkAccess,
    canManage,
    getAllPermissions: userRole ? rbacService.getAllPermissions(userRole) : [],
    roleDefinition: userRole ? rbacService.getRoleDefinition(userRole) : undefined,
  };
};

export default rbacService;
