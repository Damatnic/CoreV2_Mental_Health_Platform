import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import moodRoutes from './mood';
import crisisRoutes from './crisis';
import appointmentRoutes from './appointments';
import emergencyRoutes from './emergency';
import journalRoutes from './journal';
import medicationRoutes from './medications';
import sessionRoutes from './sessions';
import analyticsRoutes from './analytics';
import notificationRoutes from './notifications';

/**
 * Main API Router
 * Organizes all API endpoints with proper middleware and security
 */
export class APIRouter {
  private router: Router;

  constructor() {
    this.router = Router();
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // Public routes (no auth required)
    this.router.use('/auth', authRoutes);
    
    // Protected routes (authentication required)
    this.router.use('/users', userRoutes);
    this.router.use('/mood', moodRoutes);
    this.router.use('/crisis', crisisRoutes);
    this.router.use('/appointments', appointmentRoutes);
    this.router.use('/emergency', emergencyRoutes);
    this.router.use('/journal', journalRoutes);
    this.router.use('/medications', medicationRoutes);
    this.router.use('/sessions', sessionRoutes);
    this.router.use('/analytics', analyticsRoutes);
    this.router.use('/notifications', notificationRoutes);

    // API documentation endpoint
    this.router.get('/docs', (req, res) => {
      res.json({
        version: '1.0.0',
        endpoints: {
          auth: {
            'POST /auth/register': 'Register new user',
            'POST /auth/login': 'User login',
            'POST /auth/logout': 'User logout',
            'POST /auth/refresh': 'Refresh access token',
            'POST /auth/forgot-password': 'Request password reset',
            'POST /auth/reset-password': 'Reset password with token',
            'POST /auth/verify-email': 'Verify email address',
            'POST /auth/2fa/enable': 'Enable 2FA',
            'POST /auth/2fa/verify': 'Verify 2FA code'
          },
          users: {
            'GET /users/profile': 'Get current user profile',
            'PUT /users/profile': 'Update user profile',
            'DELETE /users/account': 'Delete user account',
            'GET /users/:id': 'Get user by ID (admin/therapist)',
            'PUT /users/:id/role': 'Update user role (admin)',
            'GET /users/patients': 'Get therapist\'s patients',
            'POST /users/emergency-contacts': 'Add emergency contact',
            'PUT /users/emergency-contacts/:id': 'Update emergency contact',
            'DELETE /users/emergency-contacts/:id': 'Remove emergency contact'
          },
          mood: {
            'POST /mood/entry': 'Create mood entry',
            'GET /mood/entries': 'Get user\'s mood entries',
            'GET /mood/entries/:id': 'Get specific mood entry',
            'PUT /mood/entries/:id': 'Update mood entry',
            'DELETE /mood/entries/:id': 'Delete mood entry',
            'GET /mood/analytics': 'Get mood analytics',
            'GET /mood/trends': 'Get mood trends',
            'POST /mood/quick-check': 'Quick mood check-in'
          },
          crisis: {
            'POST /crisis/alert': 'Trigger crisis alert',
            'GET /crisis/status': 'Get current crisis status',
            'POST /crisis/resolve': 'Mark crisis as resolved',
            'GET /crisis/history': 'Get crisis history',
            'POST /crisis/safety-plan': 'Create/update safety plan',
            'GET /crisis/safety-plan': 'Get safety plan',
            'POST /crisis/hotlines': 'Get crisis hotlines',
            'POST /crisis/check-in': 'Crisis check-in'
          },
          appointments: {
            'POST /appointments': 'Schedule appointment',
            'GET /appointments': 'Get user\'s appointments',
            'GET /appointments/:id': 'Get appointment details',
            'PUT /appointments/:id': 'Update appointment',
            'DELETE /appointments/:id': 'Cancel appointment',
            'POST /appointments/:id/confirm': 'Confirm appointment',
            'POST /appointments/:id/reschedule': 'Reschedule appointment',
            'GET /appointments/availability': 'Get provider availability',
            'POST /appointments/:id/notes': 'Add appointment notes'
          },
          emergency: {
            'POST /emergency/trigger': 'Trigger emergency response',
            'GET /emergency/contacts': 'Get emergency contacts',
            'POST /emergency/notify': 'Notify emergency contacts',
            'GET /emergency/services': 'Get nearby emergency services',
            'POST /emergency/location': 'Share location with emergency contacts'
          },
          journal: {
            'POST /journal/entries': 'Create journal entry',
            'GET /journal/entries': 'Get journal entries',
            'GET /journal/entries/:id': 'Get specific entry',
            'PUT /journal/entries/:id': 'Update journal entry',
            'DELETE /journal/entries/:id': 'Delete journal entry',
            'POST /journal/entries/:id/share': 'Share with therapist',
            'GET /journal/analytics': 'Get journal analytics',
            'GET /journal/prompts': 'Get journal prompts'
          },
          medications: {
            'POST /medications': 'Add medication',
            'GET /medications': 'Get user\'s medications',
            'GET /medications/:id': 'Get medication details',
            'PUT /medications/:id': 'Update medication',
            'DELETE /medications/:id': 'Remove medication',
            'POST /medications/:id/dose': 'Log medication dose',
            'GET /medications/:id/history': 'Get dose history',
            'POST /medications/:id/refill': 'Request refill',
            'GET /medications/reminders': 'Get medication reminders'
          },
          sessions: {
            'POST /sessions': 'Start therapy session',
            'GET /sessions': 'Get therapy sessions',
            'GET /sessions/:id': 'Get session details',
            'PUT /sessions/:id': 'Update session notes',
            'POST /sessions/:id/end': 'End therapy session',
            'GET /sessions/:id/recording': 'Get session recording',
            'POST /sessions/:id/homework': 'Assign homework',
            'GET /sessions/upcoming': 'Get upcoming sessions'
          },
          analytics: {
            'GET /analytics/dashboard': 'Get dashboard data',
            'GET /analytics/mood': 'Get mood analytics',
            'GET /analytics/progress': 'Get progress metrics',
            'GET /analytics/compliance': 'Get medication compliance',
            'GET /analytics/engagement': 'Get engagement metrics',
            'POST /analytics/export': 'Export analytics data'
          },
          notifications: {
            'GET /notifications': 'Get notifications',
            'PUT /notifications/:id/read': 'Mark as read',
            'PUT /notifications/read-all': 'Mark all as read',
            'PUT /notifications/preferences': 'Update preferences',
            'POST /notifications/test': 'Send test notification'
          }
        }
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

// Export individual route modules for direct import
export { default as authRoutes } from './auth';
export { default as userRoutes } from './users';
export { default as moodRoutes } from './mood';
export { default as crisisRoutes } from './crisis';
export { default as appointmentRoutes } from './appointments';
export { default as emergencyRoutes } from './emergency';
export { default as journalRoutes } from './journal';
export { default as medicationRoutes } from './medications';
export { default as sessionRoutes } from './sessions';
export { default as analyticsRoutes } from './analytics';
export { default as notificationRoutes } from './notifications';

// Export main router instance
const apiRouter = new APIRouter();
export default apiRouter.getRouter();