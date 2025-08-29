import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import useAuth from '../../../hooks/useAuth';

// Mock the auth service
jest.mock('../../../services/auth/authService');
const mockAuthService = require('../../../services/auth/authService');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default auth service mocks
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
      token: 'mock-token'
    });
    mockAuthService.logout.mockResolvedValue({ success: true });
    mockAuthService.register.mockResolvedValue({
      success: true,
      user: { id: 'user-456', email: 'new@example.com' }
    });
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should check authentication status on mount', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user']
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          roles: ['user']
        });
      });
    });

    it('should handle authentication check errors', async () => {
      mockAuthService.isAuthenticated.mockImplementation(() => {
        throw new Error('Token validation failed');
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe('Token validation failed');
      });
    });
  });

  describe('Login Functionality', () => {
    it('should login user successfully', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com'
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle login failures', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      mockAuthService.login.mockReturnValue(
        new Promise((resolve) => { resolveLogin = resolve; })
      );

      const { result } = renderHook(() => useAuth());

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Complete login
      await act(async () => {
        resolveLogin!({
          success: true,
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      // Should no longer be loading
      expect(result.current.loading).toBe(false);
    });

    it('should redirect after successful login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123', '/dashboard');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should validate login parameters', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('', 'password123');
      });

      expect(result.current.error).toContain('email is required');
      expect(mockAuthService.login).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.login('test@example.com', '');
      });

      expect(result.current.error).toContain('password is required');
    });
  });

  describe('Registration Functionality', () => {
    it('should register user successfully', async () => {
      const { result } = renderHook(() => useAuth());

      const registrationData = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        agreeToTerms: true
      };

      await act(async () => {
        await result.current.register(registrationData);
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-456',
        email: 'new@example.com'
      });
    });

    it('should handle registration failures', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'existing@example.com',
          password: 'password123',
          username: 'testuser',
          agreeToTerms: true
        });
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Email already exists');
    });

    it('should validate registration data', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'invalid-email',
          password: '123',
          username: '',
          agreeToTerms: false
        });
      });

      expect(result.current.error).toContain('invalid');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    it('should logout user successfully', async () => {
      // First login
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com'
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should redirect after logout', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout('/login');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle logout errors gracefully', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local auth state even if server logout fails
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Password Management', () => {
    it('should change password successfully', async () => {
      mockAuthService.changePassword.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.changePassword('oldPassword', 'newPassword123');
      });

      expect(mockAuthService.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword123');
      expect(result.current.error).toBeNull();
    });

    it('should handle password change failures', async () => {
      mockAuthService.changePassword.mockRejectedValue(new Error('Current password incorrect'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.changePassword('wrongOld', 'newPassword123');
      });

      expect(result.current.error).toBe('Current password incorrect');
    });

    it('should request password reset', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestPasswordReset('user@example.com');
      });

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
      expect(result.current.error).toBeNull();
    });

    it('should reset password with token', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.resetPassword('reset-token', 'newPassword123');
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'newPassword123');
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should setup 2FA', async () => {
      mockAuthService.setup2FA.mockResolvedValue({
        qrCode: 'qr-code-data',
        backupCodes: ['123456', '789012']
      });

      const { result } = renderHook(() => useAuth());

      let setupResult: any;
      await act(async () => {
        setupResult = await result.current.setup2FA();
      });

      expect(mockAuthService.setup2FA).toHaveBeenCalled();
      expect(setupResult.qrCode).toBe('qr-code-data');
      expect(setupResult.backupCodes).toHaveLength(2);
    });

    it('should verify 2FA code', async () => {
      mockAuthService.verify2FA.mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useAuth());

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verify2FA('123456');
      });

      expect(mockAuthService.verify2FA).toHaveBeenCalledWith(undefined, '123456');
      expect(verifyResult.valid).toBe(true);
    });

    it('should handle invalid 2FA codes', async () => {
      mockAuthService.verify2FA.mockResolvedValue({
        valid: false,
        attemptsRemaining: 2
      });

      const { result } = renderHook(() => useAuth());

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verify2FA('invalid');
      });

      expect(verifyResult.valid).toBe(false);
      expect(verifyResult.attemptsRemaining).toBe(2);
    });

    it('should disable 2FA', async () => {
      mockAuthService.disable2FA.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.disable2FA('password123');
      });

      expect(mockAuthService.disable2FA).toHaveBeenCalledWith('password123');
    });
  });

  describe('Token Management', () => {
    it('should refresh token automatically when expired', async () => {
      jest.useFakeTimers();
      
      mockAuthService.refreshToken.mockResolvedValue({
        success: true,
        token: 'new-token'
      });

      const { result } = renderHook(() => useAuth());

      // Simulate token expiring
      act(() => {
        jest.advanceTimersByTime(55 * 60 * 1000); // 55 minutes
      });

      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should handle token refresh failures', async () => {
      jest.useFakeTimers();
      
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh token expired'));

      const { result } = renderHook(() => useAuth());

      act(() => {
        jest.advanceTimersByTime(55 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });

      jest.useRealTimers();
    });

    it('should validate tokens periodically', async () => {
      jest.useFakeTimers();
      
      mockAuthService.validateToken.mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useAuth());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });

      await waitFor(() => {
        expect(mockAuthService.validateToken).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Permission Management', () => {
    it('should check user permissions', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user', 'helper']
      });

      mockAuthService.hasPermission.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      const hasPermission = result.current.hasPermission('moderate_posts');

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(['user', 'helper'], 'moderate_posts');
      expect(hasPermission).toBe(true);
    });

    it('should handle missing permissions', () => {
      mockAuthService.hasPermission.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      const hasPermission = result.current.hasPermission('admin_access');

      expect(hasPermission).toBe(false);
    });

    it('should check multiple permissions', () => {
      mockAuthService.hasPermission
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const { result } = renderHook(() => useAuth());

      const permissions = result.current.hasPermissions([
        'read_posts',
        'admin_access',
        'write_posts'
      ]);

      expect(permissions).toEqual([true, false, true]);
    });
  });

  describe('Session Management', () => {
    it('should track session activity', async () => {
      const { result } = renderHook(() => useAuth());

      // Simulate user activity
      act(() => {
        result.current.updateActivity();
      });

      expect(result.current.lastActivity).toBeInstanceOf(Date);
    });

    it('should handle session timeout', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useAuth());

      // Set user as authenticated
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com'
      });

      // Simulate session timeout (30 minutes of inactivity)
      act(() => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.sessionExpired).toBe(true);
      });

      jest.useRealTimers();
    });

    it('should extend session on activity', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useAuth());

      // Simulate activity just before timeout
      act(() => {
        jest.advanceTimersByTime(29 * 60 * 1000); // 29 minutes
        result.current.updateActivity();
        jest.advanceTimersByTime(2 * 60 * 1000); // 2 more minutes (31 total)
      });

      // Session should still be active
      expect(result.current.sessionExpired).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should clear errors when appropriate', async () => {
      const { result } = renderHook(() => useAuth());

      // Trigger error
      await act(async () => {
        await result.current.login('invalid@email', 'wrong');
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should retry failed operations', async () => {
      mockAuthService.login
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          user: { id: 'user-123', email: 'test@example.com' }
        });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123', undefined, { retry: true });
      });

      expect(mockAuthService.login).toHaveBeenCalledTimes(2);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle network connectivity issues', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.error).toContain('Network error');
      expect(result.current.networkError).toBe(true);
    });
  });

  describe('Security Features', () => {
    it('should detect suspicious login attempts', async () => {
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        securityAlert: {
          suspicious: true,
          reason: 'Login from new location'
        }
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.securityAlert).toEqual({
        suspicious: true,
        reason: 'Login from new location'
      });
    });

    it('should handle account lockout', async () => {
      mockAuthService.login.mockRejectedValue({
        message: 'Account locked',
        lockoutUntil: new Date(Date.now() + 300000) // 5 minutes
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.accountLocked).toBe(true);
      expect(result.current.lockoutUntil).toBeInstanceOf(Date);
    });

    it('should implement device fingerprinting', async () => {
      const { result } = renderHook(() => useAuth());

      const fingerprint = result.current.getDeviceFingerprint();

      expect(fingerprint).toHaveProperty('userAgent');
      expect(fingerprint).toHaveProperty('screen');
      expect(fingerprint).toHaveProperty('timezone');
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup timers on unmount', () => {
      jest.useFakeTimers();
      
      const { unmount } = renderHook(() => useAuth());

      unmount();

      // Verify no timer-related errors after unmount
      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      });

      jest.useRealTimers();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });
});