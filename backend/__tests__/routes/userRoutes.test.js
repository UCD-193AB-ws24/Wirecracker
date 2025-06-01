import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase } from '../routes/utils.js';

// Mock Supabase client
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /user/profile', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/user/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 for invalid session', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .get('/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired session');
    });

    it('should return user profile data', async () => {
      const mockSession = { user_id: 1 };
      const mockUser = { name: 'Test User' };

      supabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockSession, error: null })
        .mockResolvedValueOnce({ data: mockUser, error: null });

      const response = await request(app)
        .get('/user/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should handle database errors', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .get('/user/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error fetching user profile');
    });
  });
}); 