import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase, handleFileRecord } from '../../routes/utils.js';

// Mock Supabase client and handleFileRecord
vi.mock('../../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })),
  },
  handleFileRecord: vi.fn(),
}));

describe('Test Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/save-test-selection', () => {
    const validTestSelectionData = {
      tests: ['test1', 'test2'],
      contacts: ['contact1', 'contact2'],
      fileId: 1,
      fileName: 'test.txt',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-02',
      patientId: 'patient1'
    };

    it('should return 400 for missing tests data', async () => {
      const response = await request(app)
        .post('/api/save-test-selection')
        .send({
          ...validTestSelectionData,
          tests: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing tests data');
    });

    it('should return 400 for missing contacts data', async () => {
      const response = await request(app)
        .post('/api/save-test-selection')
        .send({
          ...validTestSelectionData,
          contacts: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing contacts data');
    });

    it('should return 400 for missing file ID', async () => {
      const response = await request(app)
        .post('/api/save-test-selection')
        .send({
          ...validTestSelectionData,
          fileId: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing file ID');
    });

    it('should return 400 for missing patient ID', async () => {
      const response = await request(app)
        .post('/api/save-test-selection')
        .send({
          ...validTestSelectionData,
          patientId: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing patient ID');
    });

    it('should update existing test selection when data changed', async () => {
      const existingFile = { file_id: 1 };
      const existingTestSelection = {
        tests: ['old_test'],
        contacts: ['old_contact']
      };

      // Mock the file check
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingFile, error: null })
      });

      // Mock the test selection check
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingTestSelection, error: null })
      });

      // Mock the update
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      const response = await request(app)
        .post('/api/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
    });

    it('should not update when data unchanged', async () => {
      const existingFile = { file_id: 1 };
      const existingTestSelection = {
        tests: validTestSelectionData.tests,
        contacts: validTestSelectionData.contacts
      };

      // Mock the file check
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingFile, error: null })
      });

      // Mock the test selection check
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingTestSelection, error: null })
      });

      const response = await request(app)
        .post('/api/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should create new test selection when none exists', async () => {
      // Mock the file check - no existing file
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      });

      // Mock the insert
      supabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      const response = await request(app)
        .post('/api/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
    });

    it('should handle file record errors', async () => {
      // Mock the file check - no existing file
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      });

      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/api/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });

  describe('GET /api/get-tests', () => {
    it('should return test data', async () => {
      const mockTests = [
        {
          id: 1,
          name: 'Test 1',
          description: 'Description 1',
          test_tag: [{ tag: { name: 'tag1' } }],
          function_test: [{
            function: {
              gm_function: [{ gm: { name: 'region1' } }]
            }
          }]
        },
        {
          id: 2,
          name: 'Test 2',
          description: 'Description 2',
          test_tag: [{ tag: { name: 'tag2' } }],
          function_test: [{
            function: {
              gm_function: [{ gm: { name: 'region2' } }]
            }
          }]
        }
      ];

      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: mockTests, error: null })
      });

      const response = await request(app)
        .get('/api/get-tests');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        {
          id: 1,
          name: 'Test 1',
          description: 'Description 1',
          population: 20,
          disruptionRate: 50.5,
          tag: ['tag1'],
          region: ['region1']
        },
        {
          id: 2,
          name: 'Test 2',
          description: 'Description 2',
          population: 20,
          disruptionRate: 50.5,
          tag: ['tag2'],
          region: ['region2']
        }
      ]);
    });

    it('should handle database errors', async () => {
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      });

      const response = await request(app)
        .get('/api/get-tests');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });
}); 