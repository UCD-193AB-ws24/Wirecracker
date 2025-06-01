import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase } from '../routes/utils.js';

// Mock Supabase client
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
  sendShareNotification: vi.fn(),
}));

describe('File Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /files', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/files');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return user files with valid token', async () => {
      const mockFiles = [
        { file_id: 1, filename: 'test1.txt' },
        { file_id: 2, filename: 'test2.txt' }
      ];

      supabase.from().select().eq().order().mockResolvedValue({ 
        data: mockFiles, 
        error: null 
      });

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });

      const response = await request(app)
        .get('/files')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFiles);
    });
  });

  describe('POST /files/metadata', () => {
    it('should save file metadata successfully', async () => {
      const fileData = {
        fileId: '123',
        fileName: 'test.txt',
        creationDate: '2024-01-01',
        modifiedDate: '2024-01-02',
        patientId: 'patient1'
      };

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });

      const response = await request(app)
        .post('/files/metadata')
        .set('Authorization', 'Bearer valid-token')
        .send(fileData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /files/check-type', () => {
    it('should return file type information', async () => {
      const mockLocalizationData = [{ id: 1 }];
      const mockResectionData = { designation_data: {}, localization_data: {} };
      const mockDesignationData = { designation_data: {}, localization_data: {} };
      const mockTestSelectionData = { tests: [], contacts: [] };
      const mockStimulationData = { stimulation_data: {}, plan_order: [], is_mapping: false };

      supabase.from().select().eq().limit().mockResolvedValue({ 
        data: mockLocalizationData, 
        error: null 
      });

      supabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockResectionData, error: null })
        .mockResolvedValueOnce({ data: mockDesignationData, error: null })
        .mockResolvedValueOnce({ data: mockTestSelectionData, error: null })
        .mockResolvedValueOnce({ data: mockStimulationData, error: null });

      const response = await request(app)
        .get('/files/check-type?fileId=123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasLocalization: true,
        hasResection: true,
        hasDesignation: true,
        hasTestSelection: true,
        hasStimulation: true,
        resectionData: {
          resection_data: mockResectionData.designation_data,
          localization_data: mockResectionData.localization_data
        },
        designationData: {
          designation_data: mockDesignationData.designation_data,
          localization_data: mockDesignationData.localization_data
        },
        testSelectionData: {
          tests: mockTestSelectionData.tests,
          contacts: mockTestSelectionData.contacts
        },
        stimulationData: {
          stimulation_data: mockStimulationData.stimulation_data,
          plan_order: mockStimulationData.plan_order,
          is_mapping: mockStimulationData.is_mapping
        }
      });
    });
  });

  describe('GET /files/localization', () => {
    it('should return localization data', async () => {
      const mockLocalizationData = [
        {
          id: 1,
          contact: 'A1',
          tissue_type: 'GM',
          file_id: 123,
          electrode: { id: 1, label: 'E1', description: 'Electrode 1', contact_number: 8, type: 'DIXI' },
          region: { id: 1, name: 'Region A' }
        }
      ];

      supabase.from().select().eq().mockResolvedValue({ 
        data: mockLocalizationData, 
        error: null 
      });

      const response = await request(app)
        .get('/files/localization?fileId=123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLocalizationData);
    });
  });

  describe('GET /files/patient/:fileId', () => {
    it('should return patient ID for file', async () => {
      const mockFile = { patient_id: 'patient1' };

      supabase.from().select().eq().single
        .mockResolvedValueOnce({ data: { user_id: 1 }, error: null })
        .mockResolvedValueOnce({ data: mockFile, error: null });

      const response = await request(app)
        .get('/files/patient/123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ patientId: 'patient1' });
    });
  });

  describe('GET /patients/recent', () => {
    it('should return paginated patients with files', async () => {
      const mockPatients = [
        { id: 1, name: 'Patient A', files: [{ id: 1, name: 'file1.txt' }] },
        { id: 2, name: 'Patient B', files: [{ id: 2, name: 'file2.txt' }] }
      ];

      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });

      supabase.from().select().order().limit().offset().mockResolvedValue({ 
        data: mockPatients, 
        error: null 
      });

      const response = await request(app)
        .get('/patients/recent?page=1&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });
  });
}); 