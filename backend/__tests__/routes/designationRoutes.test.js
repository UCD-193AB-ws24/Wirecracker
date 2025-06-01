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

describe('Designation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /save-designation', () => {
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
        .post('/save-designation')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing designation data');
    });

    it('should create new designation record for new file', async () => {
      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      supabase.from().insert().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
      expect(supabase.from().insert).toHaveBeenCalled();
    });

    it('should update existing designation when data changed', async () => {
      const existingFile = { file_id: 1 };
      const existingDesignation = {
        designation_data: { old: 'data' },
        localization_data: { old: 'localization' }
      };

      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: existingFile, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: existingDesignation, 
        error: null 
      });

      supabase.from().update().eq().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalled();
    });

    it('should not update when data unchanged', async () => {
      const existingFile = { file_id: 1 };
      const existingDesignation = {
        designation_data: validDesignationData.designationData,
        localization_data: validDesignationData.localizationData
      };

      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: existingFile, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: existingDesignation, 
        error: null 
      });

      const response = await request(app)
        .post('/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().update).not.toHaveBeenCalled();
    });

    it('should handle file record errors', async () => {
      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/save-designation')
        .set('Authorization', 'Bearer valid-token')
        .send(validDesignationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });

  describe('GET /by-patient/:patientId', () => {
    it('should return 400 for missing patient ID', async () => {
      const response = await request(app).get('/by-patient/');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing patient ID');
    });

    it('should return exists: false when no file found', async () => {
      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const response = await request(app)
        .get('/by-patient/123?type=resection');

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

      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: mockFileData, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: mockDesignationData, 
        error: null 
      });

      const response = await request(app)
        .get('/by-patient/123?type=resection');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        exists: true,
        data: mockDesignationData
      });
    });

    it('should handle database errors', async () => {
      supabase.from().select().eq().ilike().single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .get('/by-patient/123?type=resection');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch file');
    });
  });
}); 