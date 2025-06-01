import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase, handleFileRecord } from '../routes/utils.js';

// Mock Supabase client and handleFileRecord
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
  handleFileRecord: vi.fn(),
}));

describe('Test Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /save-test-selection', () => {
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
        .post('/save-test-selection')
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
        .post('/save-test-selection')
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
        .post('/save-test-selection')
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
        .post('/save-test-selection')
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

      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: existingFile, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: existingTestSelection, 
        error: null 
      });

      supabase.from().update().eq().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
      expect(supabase.from().update).toHaveBeenCalled();
    });

    it('should not update when data unchanged', async () => {
      const existingFile = { file_id: 1 };
      const existingTestSelection = {
        tests: validTestSelectionData.tests,
        contacts: validTestSelectionData.contacts
      };

      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: existingFile, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: existingTestSelection, 
        error: null 
      });

      const response = await request(app)
        .post('/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().update).not.toHaveBeenCalled();
    });

    it('should create new test selection when none exists', async () => {
      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      supabase.from().insert().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
      expect(supabase.from().insert).toHaveBeenCalled();
    });

    it('should handle file record errors', async () => {
      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/save-test-selection')
        .set('Authorization', 'Bearer valid-token')
        .send(validTestSelectionData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });

  describe('GET /get-tests', () => {
    it('should return test data', async () => {
      const mockTests = [
        { id: 1, name: 'Test 1', description: 'Description 1' },
        { id: 2, name: 'Test 2', description: 'Description 2' }
      ];

      supabase.from().select().mockResolvedValue({ 
        data: mockTests, 
        error: null 
      });

      const response = await request(app)
        .get('/get-tests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTests);
    });

    it('should handle database errors', async () => {
      supabase.from().select().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .get('/get-tests');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });
}); 