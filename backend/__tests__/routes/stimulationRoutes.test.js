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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
  handleFileRecord: vi.fn(),
}));

describe('Stimulation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /by-patient-stimulation/:patientId', () => {
    it('should return 400 for missing patient ID', async () => {
      const response = await request(app).get('/by-patient-stimulation/');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing patient ID');
    });

    it('should return exists: false when no file found', async () => {
      supabase.from().select().eq().eq().order().limit().mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const response = await request(app)
        .get('/by-patient-stimulation/123?type=mapping');

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

      supabase.from().select().eq().eq().order().limit().mockResolvedValue({ 
        data: mockFileData, 
        error: null 
      });

      supabase.from().select().eq().mockResolvedValue({ 
        data: mockStimulationData, 
        error: null 
      });

      const response = await request(app)
        .get('/by-patient-stimulation/123?type=mapping');

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

  describe('POST /save-stimulation', () => {
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
        .post('/save-stimulation')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing electrodes data');
    });

    it('should return 400 for invalid stimulation type', async () => {
      const response = await request(app)
        .post('/save-stimulation')
        .send({
          ...validStimulationData,
          type: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or missing stimulation type');
    });

    it('should create new stimulation record', async () => {
      supabase.from().select().eq().mockResolvedValue({ 
        data: [], 
        error: null 
      });

      supabase.from().insert().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalled();
      expect(supabase.from().insert).toHaveBeenCalled();
    });

    it('should update existing stimulation record when data changed', async () => {
      const existingData = [{
        stimulation_data: { old: 'data' },
        plan_order: ['old'],
        type: 'mapping'
      }];

      supabase.from().select().eq().mockResolvedValue({ 
        data: existingData, 
        error: null 
      });

      supabase.from().update().eq().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const response = await request(app)
        .post('/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalled();
    });

    it('should not update when data unchanged', async () => {
      const existingData = [{
        stimulation_data: validStimulationData.electrodes,
        plan_order: validStimulationData.planOrder,
        type: validStimulationData.type
      }];

      supabase.from().select().eq().mockResolvedValue({ 
        data: existingData, 
        error: null 
      });

      const response = await request(app)
        .post('/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().update).not.toHaveBeenCalled();
    });

    it('should handle file record errors', async () => {
      handleFileRecord.mockRejectedValue(new Error('File record error'));

      const response = await request(app)
        .post('/save-stimulation')
        .set('Authorization', 'Bearer valid-token')
        .send(validStimulationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to save file metadata');
    });
  });
}); 