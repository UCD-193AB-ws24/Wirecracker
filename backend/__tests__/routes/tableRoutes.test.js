import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase, TABLE_NAMES } from '../routes/utils.js';

// Mock Supabase client
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    })),
  },
  TABLE_NAMES: ['test_table1', 'test_table2'],
}));

describe('Table Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /tables', () => {
    it('should return list of table names', async () => {
      const response = await request(app)
        .get('/tables');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tables: ['test_table1', 'test_table2']
      });
    });
  });

  describe('GET /tables/:table', () => {
    it('should return 400 for invalid table name', async () => {
      const response = await request(app)
        .get('/tables/invalid_table');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid table name');
    });

    it('should return table data for valid table name', async () => {
      const mockData = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];

      supabase.from().select().limit().mockResolvedValue({ 
        data: mockData, 
        error: null 
      });

      const response = await request(app)
        .get('/tables/test_table1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('test_table1');
      expect(supabase.from().select).toHaveBeenCalledWith('*');
      expect(supabase.from().select().limit).toHaveBeenCalledWith(100);
    });

    it('should handle database errors', async () => {
      supabase.from().select().limit().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .get('/tables/test_table1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error fetching table data');
    });
  });
}); 