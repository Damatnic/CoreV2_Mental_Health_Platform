import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type Role = 'user' | 'helper' | 'therapist' | 'admin' | 'moderator';
type Permission = string;

class RoleAccessManager {
  private rolePermissions: Map<Role, Set<Permission>> = new Map();
  
  constructor() {
    this.initializePermissions();
  }

  private initializePermissions() {
    // User permissions
    this.rolePermissions.set('user', new Set([
      'read:own-profile',
      'write:own-profile',
      'read:public-content',
      'write:journal',
      'read:crisis-resources'
    ]));

    // Helper permissions
    this.rolePermissions.set('helper', new Set([
      ...this.rolePermissions.get('user')!,
      'read:help-requests',
      'write:help-responses',
      'read:user-profiles'
    ]));

    // Therapist permissions  
    this.rolePermissions.set('therapist', new Set([
      ...this.rolePermissions.get('helper')!,
      'read:patient-data',
      'write:treatment-notes',
      'manage:appointments'
    ]));

    // Moderator permissions
    this.rolePermissions.set('moderator', new Set([
      ...this.rolePermissions.get('user')!,
      'moderate:content',
      'manage:reports',
      'ban:users'
    ]));

    // Admin permissions
    this.rolePermissions.set('admin', new Set([
      'admin:all'
    ]));
  }

  hasPermission(role: Role, permission: Permission): boolean {
    const permissions = this.rolePermissions.get(role);
    if (!permissions) return false;
    
    if (permissions.has('admin:all')) return true;
    return permissions.has(permission);
  }

  getRolePermissions(role: Role): Permission[] {
    const permissions = this.rolePermissions.get(role);
    return permissions ? Array.from(permissions) : [];
  }

  canAccessRoute(role: Role, route: string): boolean {
    const routePermissions: Record<string, Permission> = {
      '/admin': 'admin:all',
      '/therapist/dashboard': 'manage:appointments',
      '/helper/requests': 'read:help-requests',
      '/profile': 'read:own-profile',
      '/crisis': 'read:crisis-resources'
    };

    const required = routePermissions[route];
    if (!required) return true;
    
    return this.hasPermission(role, required);
  }

  canPerformAction(role: Role, action: string, resource: any): boolean {
    // Check ownership
    if (resource?.ownerId && action.includes('own')) {
      return true; // Simplified ownership check
    }

    const permission = `${action}:${resource?.type || 'general'}`;
    return this.hasPermission(role, permission);
  }
}

describe('RoleAccessManager', () => {
  let manager: RoleAccessManager;

  beforeEach(() => {
    manager = new RoleAccessManager();
  });

  describe('Permission Checking', () => {
    it('should grant user basic permissions', () => {
      expect(manager.hasPermission('user', 'read:own-profile')).toBe(true);
      expect(manager.hasPermission('user', 'write:journal')).toBe(true);
    });

    it('should deny user elevated permissions', () => {
      expect(manager.hasPermission('user', 'manage:appointments')).toBe(false);
      expect(manager.hasPermission('user', 'moderate:content')).toBe(false);
    });

    it('should grant helper inherited permissions', () => {
      expect(manager.hasPermission('helper', 'read:own-profile')).toBe(true);
      expect(manager.hasPermission('helper', 'read:help-requests')).toBe(true);
    });

    it('should grant therapist clinical permissions', () => {
      expect(manager.hasPermission('therapist', 'read:patient-data')).toBe(true);
      expect(manager.hasPermission('therapist', 'write:treatment-notes')).toBe(true);
    });

    it('should grant admin all permissions', () => {
      expect(manager.hasPermission('admin', 'anything')).toBe(true);
      expect(manager.hasPermission('admin', 'admin:all')).toBe(true);
    });
  });

  describe('Route Access', () => {
    it('should allow users to access public routes', () => {
      expect(manager.canAccessRoute('user', '/profile')).toBe(true);
      expect(manager.canAccessRoute('user', '/crisis')).toBe(true);
    });

    it('should restrict admin routes', () => {
      expect(manager.canAccessRoute('user', '/admin')).toBe(false);
      expect(manager.canAccessRoute('admin', '/admin')).toBe(true);
    });

    it('should restrict therapist routes', () => {
      expect(manager.canAccessRoute('user', '/therapist/dashboard')).toBe(false);
      expect(manager.canAccessRoute('therapist', '/therapist/dashboard')).toBe(true);
    });

    it('should allow unrestricted routes', () => {
      expect(manager.canAccessRoute('user', '/public')).toBe(true);
      expect(manager.canAccessRoute('user', '/about')).toBe(true);
    });
  });

  describe('Role Permissions Listing', () => {
    it('should list all permissions for a role', () => {
      const userPerms = manager.getRolePermissions('user');
      
      expect(userPerms).toContain('read:own-profile');
      expect(userPerms).toContain('write:journal');
      expect(userPerms.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid role', () => {
      const perms = manager.getRolePermissions('invalid' as Role);
      expect(perms).toEqual([]);
    });
  });

  describe('Action Authorization', () => {
    it('should allow actions on own resources', () => {
      const resource = { type: 'profile', ownerId: 'user123' };
      expect(manager.canPerformAction('user', 'write:own', resource)).toBe(true);
    });

    it('should check resource-specific permissions', () => {
      const resource = { type: 'patient-data' };
      expect(manager.canPerformAction('therapist', 'read', resource)).toBe(true);
      expect(manager.canPerformAction('user', 'read', resource)).toBe(false);
    });
  });
});
