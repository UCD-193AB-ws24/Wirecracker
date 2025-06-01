import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import passport from 'passport';
import app from '../server.js';

// Mock passport authentication
vi.mock('passport', () => ({
  initialize: vi.fn(),
  session: vi.fn(),
  authenticate: vi.fn((strategy, options) => (req, res, next) => {
    if (options.failureRedirect) {
      res.redirect(options.failureRedirect);
    } else {
      next();
    }
  }),
  use: vi.fn(),
}));

describe('OAuth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize passport middleware', () => {
    expect(passport.initialize).toHaveBeenCalled();
    expect(passport.session).toHaveBeenCalled();
  });

  it('should handle Google authentication route', async () => {
    const response = await request(app)
      .get('/auth/google')
      .query({ redirect_uri: '/dashboard' });
    
    expect(response.status).toBe(302); // Redirect status
  });

  it('should handle Google callback route', async () => {
    const response = await request(app)
      .get('/auth/google/callback')
      .query({ state: '/dashboard' });
    
    expect(response.status).toBe(302); // Redirect status
  });
}); 