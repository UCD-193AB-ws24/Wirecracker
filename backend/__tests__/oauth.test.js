import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import oauthRouter from '../oauth.js';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '123', email: 'test@example.com', name: 'Test User' },
            error: null
          }))
        }))
      }))
    }))
  }))
}));

vi.mock('passport-google-oauth20', () => ({
  Strategy: vi.fn()
}));

vi.mock('express-session', () => ({
  default: vi.fn(() => (req, res, next) => next())
}));

vi.mock('passport', () => ({
  default: {
    initialize: vi.fn(() => (req, res, next) => next()),
    session: vi.fn(() => (req, res, next) => next()),
    use: vi.fn(),
    authenticate: vi.fn(() => (req, res, next) => next()),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn()
  }
}));

describe('OAuth Router', () => {
  let app;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    app = express();
    mockReq = {
      query: {},
      user: { token: 'test-token' }
    };
    mockRes = {
      redirect: vi.fn()
    };
    mockNext = vi.fn();
  });

  it('should initialize passport middleware', () => {
    app.use(oauthRouter);
    expect(passport.initialize).toHaveBeenCalled();
    expect(passport.session).toHaveBeenCalled();
  });

  it('should configure Google strategy', () => {
    expect(GoogleStrategy).toHaveBeenCalled();
  });

  it('should handle Google authentication route', () => {
    const req = { ...mockReq, query: { redirect_uri: '/dashboard' } };
    const res = { ...mockRes };
    const next = mockNext;

    oauthRouter.get('/auth/google', (req, res, next) => {
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: ['profile', 'email'],
        state: '/dashboard'
      });
    });
  });

  it('should handle Google callback with success', () => {
    const req = { ...mockReq, query: { state: '/dashboard' } };
    const res = { ...mockRes };

    oauthRouter.get('/auth/google/callback', (req, res) => {
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth-success?token=test-token&redirect=/dashboard')
      );
    });
  });

  it('should handle Google callback with failure', () => {
    const req = { ...mockReq };
    const res = { ...mockRes };

    oauthRouter.get('/auth/google/callback', (req, res) => {
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth-success?token=test-token&redirect=/')
      );
    });
  });
}); 