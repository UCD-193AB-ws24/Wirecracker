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
      single: vi.fn().mockReturnThis()
    })),
  },
  handleFileRecord: vi.fn(),
}));

describe('Designation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/save-designation', () => {
    const validDesignationData = {
      designationData: { test: 'data' },
      localizationData: { test: 'localization' },
      fileId: 1,
      fileName: 'test.txt',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-02',
      patientId: 'patient1'
    };

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/save-designation')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing designation data');
    });

    it('should create new designation record for new file', async () => {
      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      // Create mock chain for insert
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockFileCheck)
        .mockReturnValueOnce(mockInsert);

      const response = await request(app)
        .post('/api/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
      expect(mockInsert.insert).toHaveBeenCalled();
    });

    it('should update existing designation when data changed', async () => {
      const existingFile = { file_id: 1 };
      const existingDesignation = {
        designation_data: { old: 'data' },
        localization_data: { old: 'localization' }
      };

      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingFile, error: null })
      };

      // Create mock chain for designation check
      const mockDesignationCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingDesignation, error: null })
      };

      // Create mock chain for update
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockFileCheck)
        .mockReturnValueOnce(mockDesignationCheck)
        .mockReturnValueOnce(mockUpdate);

      const response = await request(app)
        .post('/api/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUpdate.update).toHaveBeenCalled();
    });

    it('should not update when data unchanged', async () => {
      const existingFile = { file_id: 1 };
      const existingDesignation = {
        designation_data: validDesignationData.designationData,
        localization_data: validDesignationData.localizationData
      };

      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingFile, error: null })
      };

      // Create mock chain for designation check
      const mockDesignationCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingDesignation, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockFileCheck)
        .mockReturnValueOnce(mockDesignationCheck);

      const response = await request(app)
        .post('/api/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockDesignationCheck.select).toHaveBeenCalled();
    });

    it('should handle file record errors', async () => {
      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/api/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });

  describe('GET /api/by-patient/:patientId', () => {
    it('should return 404 for missing patient ID', async () => {
      const response = await request(app).get('/api/by-patient/');
      expect(response.status).toBe(404);
    });

    it('should return exists: false when no file found', async () => {
      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      supabase.from.mockReturnValueOnce(mockFileCheck);

      const response = await request(app)
        .get('/api/by-patient/123?type=resection');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.exists).toBe(false);
    });

    it('should return designation data when found', async () => {
      const mockFileData = { file_id: 1 };
      const mockDesignationData = {
        designation_data: { test: 'data' },
        localization_data: { test: 'localization' }
      };

      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFileData, error: null })
      };

      // Create mock chain for designation check
      const mockDesignationCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDesignationData, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockFileCheck)
        .mockReturnValueOnce(mockDesignationCheck);

      const response = await request(app)
        .get('/api/by-patient/123?type=resection');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        exists: true,
        data: mockDesignationData,
        fileId: mockFileData.file_id
      });
    });

    it('should handle database errors', async () => {
      // Create mock chain for file check with error
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      };

      supabase.from.mockReturnValueOnce(mockFileCheck);

      const response = await request(app)
        .get('/api/by-patient/123?type=resection');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch file');
    });
  });
}); 