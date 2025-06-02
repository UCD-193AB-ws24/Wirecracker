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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis()
    })),
  },
  handleFileRecord: vi.fn(),
}));

describe('Stimulation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/by-patient-stimulation/:patientId', () => {
    it('should return 404 for missing patient ID', async () => {
      const response = await request(app)
        .get('/api/by-patient-stimulation/');

      expect(response.status).toBe(404);
    });

    it('should return exists: false when no file found', async () => {
      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValueOnce(mockFileCheck);

      const response = await request(app)
        .get('/api/by-patient-stimulation/123?type=mapping');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.exists).toBe(false);
    });

    it('should return stimulation data when found', async () => {
      const mockFileData = [{
        file_id: 1,
        modified_date: '2024-01-01'
      }];

      const mockStimulationData = [{
        stimulation_data: { test: 'data' },
        plan_order: ['plan1', 'plan2'],
        type: 'mapping'
      }];

      // Create mock chain for file check
      const mockFileCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockFileData, error: null })
      };

      // Create mock chain for stimulation check
      const mockStimulationCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockStimulationData, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockFileCheck)
        .mockReturnValueOnce(mockStimulationCheck);

      const response = await request(app)
        .get('/api/by-patient-stimulation/123?type=mapping');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        exists: true,
        fileId: 1,
        data: {
          stimulation_data: mockStimulationData[0].stimulation_data,
          plan_order: mockStimulationData[0].plan_order,
          type: mockStimulationData[0].type,
          modified_date: mockFileData[0].modified_date
        }
      });
    });
  });

  describe('POST /api/save-stimulation', () => {
    const validStimulationData = {
      electrodes: { test: 'data' },
      planOrder: ['plan1', 'plan2'],
      type: 'mapping',
      fileId: 1,
      fileName: 'test.txt',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-02',
      patientId: 'patient1'
    };

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/save-stimulation')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing electrodes data');
    });

    it('should return 400 for invalid stimulation type', async () => {
      const response = await request(app)
        .post('/api/save-stimulation')
        .send({
          ...validStimulationData,
          type: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or missing stimulation type');
    });

    it('should create new stimulation record', async () => {
      // Create mock chain for existing data check
      const mockExistingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      // Create mock chain for insert
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockExistingCheck)
        .mockReturnValueOnce(mockInsert);

      const response = await request(app)
        .post('/api/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
    });

    it('should update existing stimulation record when data changed', async () => {
      const existingData = [{
        stimulation_data: { old: 'data' },
        plan_order: ['old'],
        type: 'mapping'
      }];

      // Create mock chain for existing data check
      const mockExistingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: existingData, error: null })
      };

      // Create mock chain for update
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockExistingCheck)
        .mockReturnValueOnce(mockUpdate);

      const response = await request(app)
        .post('/api/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not update when data unchanged', async () => {
      const existingData = [{
        stimulation_data: validStimulationData.electrodes,
        plan_order: validStimulationData.planOrder,
        type: validStimulationData.type
      }];

      // Create mock chain for existing data check
      const mockExistingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: existingData, error: null })
      };

      supabase.from.mockReturnValueOnce(mockExistingCheck);

      const response = await request(app)
        .post('/api/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle file record errors', async () => {
      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/api/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });
}); 