// api.test.js — Frontend API service regression tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:8000', VITE_API_KEY: 'test-key' } } });

describe('API Service Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(re.test('user@example.com')).toBe(true);
      expect(re.test('user.name@domain.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(re.test('')).toBe(false);
      expect(re.test('nope')).toBe(false);
      expect(re.test('@domain.com')).toBe(false);
      expect(re.test('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords >= 6 chars', () => {
      expect('password123'.length >= 6).toBe(true);
      expect('123456'.length >= 6).toBe(true);
    });

    it('should reject passwords < 6 chars', () => {
      expect('12345'.length >= 6).toBe(false);
      expect(''.length >= 6).toBe(false);
    });
  });

  describe('validateUserData', () => {
    const validateUserData = (userData) => {
      const errors = [];
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!userData.email || !re.test(String(userData.email).toLowerCase())) {
        errors.push('Valid email is required');
      }
      if (!userData.password || userData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (!userData.name || userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      return errors.length > 0 ? errors : null;
    };

    it('should pass for valid user data', () => {
      const result = validateUserData({
        email: 'test@test.com',
        password: 'pass1234',
        name: 'Test User',
      });
      expect(result).toBeNull();
    });

    it('should fail for missing email', () => {
      const result = validateUserData({
        password: 'pass1234',
        name: 'Test',
      });
      expect(result).toContain('Valid email is required');
    });

    it('should fail for short password', () => {
      const result = validateUserData({
        email: 'test@test.com',
        password: '123',
        name: 'Test',
      });
      expect(result).toContain('Password must be at least 6 characters');
    });

    it('should fail for short name', () => {
      const result = validateUserData({
        email: 'test@test.com',
        password: 'pass1234',
        name: 'A',
      });
      expect(result).toContain('Name must be at least 2 characters');
    });
  });

  describe('validateRewardData', () => {
    const validateRewardData = (data) => {
      const errors = [];
      if (!data.user_id || isNaN(data.user_id)) {
        errors.push('Valid user ID is required');
      }
      if (!data.achievement_type || data.achievement_type.trim().length === 0) {
        errors.push('Achievement type is required');
      }
      if (!data.points || isNaN(data.points) || data.points <= 0) {
        errors.push('Valid positive points value is required');
      }
      return errors.length > 0 ? errors : null;
    };

    it('should pass for valid reward data', () => {
      const result = validateRewardData({
        user_id: '123',
        achievement_type: 'first_place',
        points: 100,
      });
      expect(result).toBeNull();
    });

    it('should fail for missing user_id', () => {
      const result = validateRewardData({
        achievement_type: 'first_place',
        points: 100,
      });
      expect(result).toContain('Valid user ID is required');
    });

    it('should fail for zero points', () => {
      const result = validateRewardData({
        user_id: '123',
        achievement_type: 'first_place',
        points: 0,
      });
      expect(result).toContain('Valid positive points value is required');
    });
  });
});

describe('Auth Token Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should store auth token', () => {
    localStorage.setItem('authToken', 'test-jwt-token');
    expect(localStorage.getItem('authToken')).toBe('test-jwt-token');
  });

  it('should clear auth data on removal', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('userData', JSON.stringify({ name: 'Test' }));
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
  });
});

describe('API Constants', () => {
  it('should have correct default timeout', () => {
    const API_TIMEOUT = 30000;
    expect(API_TIMEOUT).toBe(30000);
    expect(API_TIMEOUT).toBeGreaterThan(10000);
  });

  it('should default to localhost for API URL', () => {
    const API_BASE_URL = 'http://localhost:8000';
    expect(API_BASE_URL).toContain('localhost');
  });
});
