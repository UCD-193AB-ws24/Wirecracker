import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase, handleFileRecord } from '../../routes/utils.js';

// Mock Supabase client and utility functions
vi.mock('../../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(),
  },
  handleFileRecord: vi.fn(),
}));

describe('File Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/files', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/files');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return user files with valid token', async () => {
      const mockFiles = [
        { file_id: 1, filename: 'test1.txt' },
        { file_id: 2, filename: 'test2.txt' }
      ];

      // Mock session query
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      // Mock files query
      const mockFilesChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockFiles, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockFilesChain);

      const response = await request(app)
        .get('/api/files')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFiles);
    });
  });

  describe('POST /api/files/metadata', () => {
    it('should save file metadata successfully', async () => {
      const fileData = {
        fileId: '123',
        fileName: 'test.txt',
        creationDate: '2024-01-01',
        modifiedDate: '2024-01-02',
        patientId: 'patient1'
      };

      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      supabase.from.mockReturnValue(mockSessionChain);
      handleFileRecord.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/files/metadata')
        .set('Authorization', 'Bearer valid-token')
        .send(fileData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(handleFileRecord).toHaveBeenCalledWith(
        fileData.fileId,
        fileData.fileName,
        fileData.creationDate,
        fileData.modifiedDate,
        'valid-token',
        fileData.patientId
      );
    });
  });

  describe('GET /api/files/check-type', () => {
    it('should return file type information', async () => {
      const mockLocalizationData = [{ id: 1 }];
      const mockResectionData = { designation_data: {}, localization_data: {} };
      const mockDesignationData = { designation_data: {}, localization_data: {} };
      const mockTestSelectionData = { tests: [], contacts: [] };
      const mockStimulationData = { stimulation_data: {}, plan_order: [], is_mapping: false };

      // Mock localization query
      const mockLocalizationChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockLocalizationData, error: null })
      };

      // Mock resection query
      const mockResectionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResectionData, error: null })
      };

      // Mock designation query
      const mockDesignationChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDesignationData, error: null })
      };

      // Mock test selection query
      const mockTestSelectionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTestSelectionData, error: null })
      };

      // Mock stimulation query
      const mockStimulationChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockStimulationData, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockLocalizationChain)
        .mockReturnValueOnce(mockResectionChain)
        .mockReturnValueOnce(mockDesignationChain)
        .mockReturnValueOnce(mockTestSelectionChain)
        .mockReturnValueOnce(mockStimulationChain);

      const response = await request(app)
        .get('/api/files/check-type?fileId=123')
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

  describe('GET /api/files/localization', () => {
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

      const mockLocalizationChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLocalizationData, error: null })
      };

      supabase.from.mockReturnValue(mockLocalizationChain);

      const response = await request(app)
        .get('/api/files/localization?fileId=123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLocalizationData);
    });
  });

  describe('GET /api/files/patient/:fileId', () => {
    it('should return patient ID for file', async () => {
      const mockFile = { patient_id: 'patient1' };

      // Mock session query
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      // Mock file query
      const mockFileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockFileChain);

      const response = await request(app)
        .get('/api/files/patient/123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ patientId: 'patient1' });
    });
  });

  describe('GET /api/patients/recent', () => {
    it('should return paginated patients with files', async () => {
      const mockPatients = [
        { 
          patient_id: '1',
          latest_file: {
            file_id: 1,
            filename: 'anatomy.txt',
            creation_date: '2024-01-01',
            modified_date: '2024-01-02',
            owner_user_id: 1,
            patient_id: '1'
          },
          has_localization: true,
          has_resection: false,
          has_designation: false,
          has_test_selection: false,
          localization_file_id: 1,
          resection_file_id: null,
          designation_file_id: null,
          test_selection_file_id: null,
          localization_creation_date: '2024-01-01',
          stimulation_types: {
            mapping: null,
            recreation: null,
            ccep: null
          }
        },
        { 
          patient_id: '2',
          latest_file: {
            file_id: 2,
            filename: 'neurosurgery.txt',
            creation_date: '2024-01-01',
            modified_date: '2024-01-02',
            owner_user_id: 1,
            patient_id: '2'
          },
          has_localization: false,
          has_resection: true,
          has_designation: false,
          has_test_selection: false,
          localization_file_id: null,
          resection_file_id: 2,
          designation_file_id: null,
          test_selection_file_id: null,
          localization_creation_date: null,
          stimulation_types: {
            mapping: null,
            recreation: null,
            ccep: null
          }
        }
      ];

      // Mock session query
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      // Mock file assignments query
      const mockAssignmentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ 
          data: [
            { patient_id: '1' },
            { patient_id: '2' }
          ], 
          error: null 
        })
      };

      // Mock files query
      const mockFilesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [
            {
              patient_id: '1',
              file_id: 1,
              filename: 'anatomy.txt',
              creation_date: '2024-01-01',
              modified_date: '2024-01-02',
              owner_user_id: 1
            },
            {
              patient_id: '2',
              file_id: 2,
              filename: 'neurosurgery.txt',
              creation_date: '2024-01-01',
              modified_date: '2024-01-02',
              owner_user_id: 1
            }
          ], 
          error: null 
        })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockAssignmentsChain)
        .mockReturnValueOnce(mockFilesChain);

      const response = await request(app)
        .get('/api/patients/recent?page=1&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        patients: mockPatients,
        totalPatients: 2,
        currentPage: 1,
        totalPages: 1
      });
    });
  });
}); 