/**
 * Role Access Control System
 *
 * Comprehensive role-based access control for the mental health platform,
 * managing user permissions, view access, and feature availability based
 * on user roles and certification levels.
 * 
 * @fileoverview Role access control utilities and permission management
 * @version 2.0.0
 */

// TODO: Import types when available
// import { Helper, View } from '../types';

// Temporary type definitions
interface Helper {
  id: string;
  role: string;
  [key: string]: any;
}

type View = string; // View is just a string identifier for now

/**
 * User role types supported by the platform
 */
export type UserRole = 
  | 'Starkeeper'      // Primary users seeking support
  | 'Community'       // Community members
  | 'Certified'       // Certified helpers
  | 'Moderator'       // Content moderators
  | 'Admin';          // Platform administrators

/**
 * Role permissions interface defining access controls
 */
export interface RolePermissions {
  role: UserRole;
  allowedViews: string[];
  deniedViews: string[];
  features: {
    canCreateContent: boolean;
    canModerate: boolean;
    canAdminister: boolean;
    canAccessCrisisTools: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canParticipateInCommunity: boolean;
  };
}

/**
 * Feature flag interface for granular permission control
 */
export interface FeaturePermissions {
  crisis: {
    canAccessPanicButton: boolean;
    canViewCrisisResources: boolean;
    canReceiveEmergencySupport: boolean;
    canProvideCrisisSupport: boolean;
  };
  community: {
    canPost: boolean;
    canComment: boolean;
    canVote: boolean;
    canReport: boolean;
    canJoinGroups: boolean;
    canCreateGroups: boolean;
  };
  moderation: {
    canReviewReports: boolean;
    canBanUsers: boolean;
    canDeleteContent: boolean;
    canAccessModerationTools: boolean;
  };
  administration: {
    canManageUsers: boolean;
    canConfigureSystem: boolean;
    canViewAllAnalytics: boolean;
    canManageRoles: boolean;
  };
}

/**
 * Comprehensive role permissions configuration
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Starkeeper: {
    role: 'Starkeeper',
    allowedViews: [
      'starkeeper-dashboard',
      'share',
      'feed',
      'crisis',
      'ai-chat',
      'safety-plan',
      'quiet-space',
      'my-activity',
      'wellness-tracking',
      'wellness-videos',
      'reflections',
      'assessments',
      'crisis-resources',
      'breathing-exercises',
      'grounding-techniques',
      'peer-support',
      'helper-community',
      'favorite-helpers',
      'past-sessions',
      'video-chat',
      'chat'
    ],
    deniedViews: [
      'moderation-dashboard',
      'admin-dashboard',
      'analytics',
      'helper-training',
      'moderation-history',
      'upload-video'
    ],
    features: {
      canCreateContent: true,
      canModerate: false,
      canAdminister: false,
      canAccessCrisisTools: true,
      canManageUsers: false,
      canViewAnalytics: false,
      canParticipateInCommunity: true
    }
  },

  Community: {
    role: 'Community',
    allowedViews: [
      'feed',
      'share',
      'my-posts',
      'my-activity',
      'chat',
      'peer-support',
      'helper-community',
      'wellness-videos',
      'crisis-resources',
      'about'
    ],
    deniedViews: [
      'starkeeper-dashboard',
      'helper-dashboard',
      'moderation-dashboard',
      'admin-dashboard',
      'analytics',
      'crisis',
      'ai-chat',
      'safety-plan',
      'assessments',
      'helper-training',
      'moderation-history'
    ],
    features: {
      canCreateContent: true,
      canModerate: false,
      canAdminister: false,
      canAccessCrisisTools: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canParticipateInCommunity: true
    }
  },

  Certified: {
    role: 'Certified',
    allowedViews: [
      'helper-dashboard',
      'helper-training',
      'helper-profile',
      'create-helper-profile',
      'feed',
      'share',
      'my-posts',
      'my-activity',
      'chat',
      'video-chat',
      'peer-support',
      'helper-community',
      'past-sessions',
      'crisis-resources',
      'wellness-videos',
      'about',
      'donation'
    ],
    deniedViews: [
      'starkeeper-dashboard',
      'moderation-dashboard',
      'admin-dashboard',
      'analytics',
      'crisis',
      'ai-chat',
      'safety-plan',
      'assessments',
      'moderation-history'
    ],
    features: {
      canCreateContent: true,
      canModerate: false,
      canAdminister: false,
      canAccessCrisisTools: true,
      canManageUsers: false,
      canViewAnalytics: false,
      canParticipateInCommunity: true
    }
  },

  Moderator: {
    role: 'Moderator',
    allowedViews: [
      'moderation-dashboard',
      'moderation-history',
      'moderation',
      'feed',
      'share',
      'my-posts',
      'my-activity',
      'chat',
      'peer-support',
      'helper-community',
      'crisis-resources',
      'wellness-videos',
      'about',
      'blocked-users'
    ],
    deniedViews: [
      'starkeeper-dashboard',
      'helper-dashboard',
      'admin-dashboard',
      'crisis',
      'ai-chat',
      'safety-plan',
      'assessments',
      'helper-training'
    ],
    features: {
      canCreateContent: true,
      canModerate: true,
      canAdminister: false,
      canAccessCrisisTools: false,
      canManageUsers: true,
      canViewAnalytics: true,
      canParticipateInCommunity: true
    }
  },

  Admin: {
    role: 'Admin',
    allowedViews: [
      'admin-dashboard',
      'analytics',
      'moderation-dashboard',
      'moderation-history',
      'moderation',
      'feed',
      'share',
      'my-posts',
      'my-activity',
      'chat',
      'peer-support',
      'helper-community',
      'crisis-resources',
      'wellness-videos',
      'about',
      'blocked-users',
      'upload-video'
    ],
    deniedViews: [
      'starkeeper-dashboard',
      'helper-dashboard',
      'crisis',
      'ai-chat',
      'safety-plan',
      'assessments',
      'helper-training'
    ],
    features: {
      canCreateContent: true,
      canModerate: true,
      canAdminister: true,
      canAccessCrisisTools: false,
      canManageUsers: true,
      canViewAnalytics: true,
      canParticipateInCommunity: true
    }
  }
};

/**
 * Feature permissions by role
 */
export const FEATURE_PERMISSIONS: Record<UserRole, FeaturePermissions> = {
  Starkeeper: {
    crisis: {
      canAccessPanicButton: true,
      canViewCrisisResources: true,
      canReceiveEmergencySupport: true,
      canProvideCrisisSupport: false
    },
    community: {
      canPost: true,
      canComment: true,
      canVote: true,
      canReport: true,
      canJoinGroups: true,
      canCreateGroups: false
    },
    moderation: {
      canReviewReports: false,
      canBanUsers: false,
      canDeleteContent: false,
      canAccessModerationTools: false
    },
    administration: {
      canManageUsers: false,
      canConfigureSystem: false,
      canViewAllAnalytics: false,
      canManageRoles: false
    }
  },

  Community: {
    crisis: {
      canAccessPanicButton: false,
      canViewCrisisResources: true,
      canReceiveEmergencySupport: false,
      canProvideCrisisSupport: false
    },
    community: {
      canPost: true,
      canComment: true,
      canVote: true,
      canReport: true,
      canJoinGroups: true,
      canCreateGroups: false
    },
    moderation: {
      canReviewReports: false,
      canBanUsers: false,
      canDeleteContent: false,
      canAccessModerationTools: false
    },
    administration: {
      canManageUsers: false,
      canConfigureSystem: false,
      canViewAllAnalytics: false,
      canManageRoles: false
    }
  },

  Certified: {
    crisis: {
      canAccessPanicButton: false,
      canViewCrisisResources: true,
      canReceiveEmergencySupport: false,
      canProvideCrisisSupport: true
    },
    community: {
      canPost: true,
      canComment: true,
      canVote: true,
      canReport: true,
      canJoinGroups: true,
      canCreateGroups: true
    },
    moderation: {
      canReviewReports: false,
      canBanUsers: false,
      canDeleteContent: false,
      canAccessModerationTools: false
    },
    administration: {
      canManageUsers: false,
      canConfigureSystem: false,
      canViewAllAnalytics: false,
      canManageRoles: false
    }
  },

  Moderator: {
    crisis: {
      canAccessPanicButton: false,
      canViewCrisisResources: true,
      canReceiveEmergencySupport: false,
      canProvideCrisisSupport: false
    },
    community: {
      canPost: true,
      canComment: true,
      canVote: true,
      canReport: true,
      canJoinGroups: true,
      canCreateGroups: true
    },
    moderation: {
      canReviewReports: true,
      canBanUsers: true,
      canDeleteContent: true,
      canAccessModerationTools: true
    },
    administration: {
      canManageUsers: true,
      canConfigureSystem: false,
      canViewAllAnalytics: false,
      canManageRoles: false
    }
  },

  Admin: {
    crisis: {
      canAccessPanicButton: false,
      canViewCrisisResources: true,
      canReceiveEmergencySupport: false,
      canProvideCrisisSupport: false
    },
    community: {
      canPost: true,
      canComment: true,
      canVote: true,
      canReport: true,
      canJoinGroups: true,
      canCreateGroups: true
    },
    moderation: {
      canReviewReports: true,
      canBanUsers: true,
      canDeleteContent: true,
      canAccessModerationTools: true
    },
    administration: {
      canManageUsers: true,
      canConfigureSystem: true,
      canViewAllAnalytics: true,
      canManageRoles: true
    }
  }
};

/**
 * Role Access Control Service
 */
export class RoleAccessService {
  /**
   * Check if a user has access to a specific view
   */
  public static canAccessView(userRole: UserRole, view: View): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) {
      return false;
    }

    return permissions.allowedViews.includes(view) && 
           !permissions.deniedViews.includes(view);
  }

  /**
   * Check if a user has a specific feature permission
   */
  public static hasFeaturePermission(
    userRole: UserRole, 
    feature: keyof RolePermissions['features']
  ): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions?.features[feature] ?? false;
  }

  /**
   * Check if a user has granular feature access
   */
  public static hasGranularPermission(
    userRole: UserRole,
    category: keyof FeaturePermissions,
    permission: string
  ): boolean {
    const featurePermissions = FEATURE_PERMISSIONS[userRole];
    const categoryPermissions = featurePermissions?.[category] as Record<string, boolean>;
    return categoryPermissions?.[permission] ?? false;
  }

  /**
   * Get all allowed views for a role
   */
  public static getAllowedViews(userRole: UserRole): View[] {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions?.allowedViews ?? [];
  }

  /**
   * Get all denied views for a role
   */
  public static getDeniedViews(userRole: UserRole): View[] {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions?.deniedViews ?? [];
  }

  /**
   * Get complete permissions for a role
   */
  public static getRolePermissions(userRole: UserRole): RolePermissions | null {
    return ROLE_PERMISSIONS[userRole] ?? null;
  }

  /**
   * Get feature permissions for a role
   */
  public static getFeaturePermissions(userRole: UserRole): FeaturePermissions | null {
    return FEATURE_PERMISSIONS[userRole] ?? null;
  }

  /**
   * Check if user can access crisis features
   */
  public static canAccessCrisisFeatures(userRole: UserRole): boolean {
    return this.hasFeaturePermission(userRole, 'canAccessCrisisTools');
  }

  /**
   * Check if user can moderate content
   */
  public static canModerate(userRole: UserRole): boolean {
    return this.hasFeaturePermission(userRole, 'canModerate');
  }

  /**
   * Check if user can administer the platform
   */
  public static canAdminister(userRole: UserRole): boolean {
    return this.hasFeaturePermission(userRole, 'canAdminister');
  }

  /**
   * Check if user can participate in community
   */
  public static canParticipateInCommunity(userRole: UserRole): boolean {
    return this.hasFeaturePermission(userRole, 'canParticipateInCommunity');
  }

  /**
   * Validate if a role is valid
   */
  public static isValidRole(role: string): role is UserRole {
    return ['Starkeeper', 'Community', 'Certified', 'Moderator', 'Admin'].includes(role);
  }

  /**
   * Get role hierarchy level (higher number = more permissions)
   */
  public static getRoleLevel(userRole: UserRole): number {
    const levels: Record<UserRole, number> = {
      'Community': 1,
      'Starkeeper': 2,
      'Certified': 3,
      'Moderator': 4,
      'Admin': 5
    };
    return levels[userRole] ?? 0;
  }

  /**
   * Check if role A has higher permissions than role B
   */
  public static hasHigherPermissions(roleA: UserRole, roleB: UserRole): boolean {
    return this.getRoleLevel(roleA) > this.getRoleLevel(roleB);
  }
}

/**
 * Role-based access control decorator for functions
 */
export function requireRole(requiredRole: UserRole) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: any, userRole: UserRole, ...args: any[]) {
      if (!RoleAccessService.hasHigherPermissions(userRole, requiredRole) && userRole !== requiredRole) {
        throw new Error(`Access denied. Required role: ${requiredRole}, current role: ${userRole}`);
      }
      return originalMethod.apply(this, [userRole, ...args]);
    };

    return descriptor;
  };
}

/**
 * Default export for convenient access
 */
export default RoleAccessService;
