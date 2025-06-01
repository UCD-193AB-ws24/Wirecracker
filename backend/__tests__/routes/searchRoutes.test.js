import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase } from '../routes/utils.js';

// Mock Supabase client
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Search Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /search', () => {
    it('should search with query and filters', async () => {
      const mockCortData = [
        {
          id: 1,
          name: 'Test Cort',
          cort_gm: [
            {
              gm: {
                id: 1,
                name: 'Test GM',
                cort_gm: [{ cort: { id: 1 } }],
                gm_function: [{ function: { id: 1 } }]
              }
            }
          ]
        }
      ];

      const mockGmData = {
        data: [
          {
            id: 2,
            name: 'Another GM',
            cort_gm: [],
            gm_function: []
          }
        ],
        error: null
      };

      const mockFuncData = {
        data: [
          {
            id: 1,
            name: 'Test Function',
            gm_function: [],
            function_test: []
          }
        ],
        error: null
      };

      const mockTestData = {
        data: [
          {
            id: 1,
            name: 'Test Test',
            function_test: []
          }
        ],
        error: null
      };

      // Mock the cort query
      supabase.from().select().or().mockResolvedValue({ 
        data: mockCortData, 
        error: null 
      });

      // Mock the parallel searches
      supabase.from().select().or()
        .mockResolvedValueOnce(mockGmData)
        .mockResolvedValueOnce(mockFuncData)
        .mockResolvedValueOnce(mockTestData);

      // Mock the relationship queries
      supabase.from().select().in()
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const response = await request(app)
        .post('/search')
        .send({
          query: 'test',
          hemisphere: ['left'],
          lobe: ['frontal']
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        cort: mockCortData,
        gm: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 })
        ]),
        functions: expect.arrayContaining([
          expect.objectContaining({ id: 1 })
        ]),
        tests: expect.arrayContaining([
          expect.objectContaining({ id: 1 })
        ])
      });
    });

    it('should handle search without query', async () => {
      const mockCortData = [
        {
          id: 1,
          name: 'Test Cort',
          cort_gm: []
        }
      ];

      supabase.from().select().or().mockResolvedValue({ 
        data: mockCortData, 
        error: null 
      });

      const response = await request(app)
        .post('/search')
        .send({
          hemisphere: ['right'],
          lobe: ['temporal']
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        cort: mockCortData,
        gm: [],
        functions: [],
        tests: []
      });
    });

    it('should handle search errors gracefully', async () => {
      supabase.from().select().or().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .post('/search')
        .send({
          query: 'test'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle related data fetching', async () => {
      const mockCortData = [{
        id: 1,
        name: 'Test Cort',
        cort_gm: [{
          gm: {
            id: 1,
            name: 'Test GM',
            cort_gm: [{ cort: { id: 1 } }],
            gm_function: [{ function: { id: 1 } }]
          }
        }]
      }];

      const mockGmData = {
        data: [{
          id: 1,
          name: 'Test GM',
          cort_gm: [],
          gm_function: [{
            function: {
              id: 1,
              name: 'Test Function',
              function_test: [{
                test: {
                  id: 1,
                  name: 'Test Test'
                }
              }]
            }
          }]
        }],
        error: null
      };

      const mockFuncData = {
        data: [{
          id: 1,
          name: 'Test Function',
          gm_function: [],
          function_test: []
        }],
        error: null
      };

      const mockTestData = {
        data: [{
          id: 1,
          name: 'Test Test',
          function_test: []
        }],
        error: null
      };

      // Mock the cort query
      supabase.from().select().or().mockResolvedValue({ 
        data: mockCortData, 
        error: null 
      });

      // Mock the parallel searches
      supabase.from().select().or()
        .mockResolvedValueOnce(mockGmData)
        .mockResolvedValueOnce(mockFuncData)
        .mockResolvedValueOnce(mockTestData);

      // Mock the relationship queries
      supabase.from().select().in()
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const response = await request(app)
        .post('/search')
        .send({
          query: 'test'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        cort: mockCortData,
        gm: expect.arrayContaining([
          expect.objectContaining({ id: 1 })
        ]),
        functions: expect.arrayContaining([
          expect.objectContaining({ id: 1 })
        ]),
        tests: expect.arrayContaining([
          expect.objectContaining({ id: 1 })
        ])
      });
    });
  });
}); 