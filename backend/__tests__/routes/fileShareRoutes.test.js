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
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('File Share Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /logs/:fileId', () => {
    it('should return combined logs of approvals and suggestions', async () => {
      const mockApprovals = [{
        approved_date: '2024-03-20T10:00:00Z',
        approved_by: { name: 'User 1' }
      }];

      const mockSuggestions = [{
        shared_date: '2024-03-19T10:00:00Z',
        changed_data: { changes: 'test' },
        current_snapshot: { data: 'test' },
        shared_with: { name: 'User 2' },
        status: 'changes_suggested'
      }];

      supabase.from().select().eq().mockResolvedValueOnce({ data: mockApprovals });
      supabase.from().select().eq().eq().mockResolvedValueOnce({ data: mockSuggestions });

      const response = await request(app)
        .get('/logs/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].type).toBe('approval');
      expect(response.body[1].type).toBe('changes');
      expect(response.body).toBeSorted((a, b) => new Date(b.date) - new Date(a.date));
    });

    it('should handle database errors', async () => {
      supabase.from().select().eq().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/logs/123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch logs');
    });
  });

  describe('POST /approve/:fileId', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/approve/123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 for invalid session', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/approve/123')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid session');
    });

    it('should approve file successfully', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });
      supabase.from().delete().eq().eq().mockResolvedValue({ error: null });
      supabase.from().insert().mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/approve/123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File approved successfully');
      expect(supabase.from).toHaveBeenCalledWith('fileshares');
      expect(supabase.from).toHaveBeenCalledWith('approved_files');
    });

    it('should handle database errors', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });
      supabase.from().delete().eq().eq().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/approve/123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to approve file');
    });
  });

  describe('POST /submit-changes/:fileId', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/submit-changes/123')
        .send({ changes: { test: 'changes' } });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 for invalid session', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/submit-changes/123')
        .set('Authorization', 'Bearer invalid-token')
        .send({ changes: { test: 'changes' } });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid session');
    });

    it('should submit changes successfully', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });
      supabase.from().update().eq().eq().mockResolvedValue({ error: null });

      const changes = { test: 'changes' };
      const response = await request(app)
        .post('/submit-changes/123')
        .set('Authorization', 'Bearer valid-token')
        .send({ changes });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Changes submitted successfully');
      expect(supabase.from).toHaveBeenCalledWith('fileshares');
    });

    it('should handle database errors', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });
      supabase.from().update().eq().eq().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/submit-changes/123')
        .set('Authorization', 'Bearer valid-token')
        .send({ changes: { test: 'changes' } });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to submit changes');
    });
  });
}); 