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

    it('should return 401 with invalid session', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from.mockReturnValue(mockSessionChain);

      const response = await request(app)
        .get('/api/files')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired session');
    });

    it('should handle database error', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockFilesChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockFilesChain);

      const response = await request(app)
        .get('/api/files')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error fetching user files');
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

    it('should handle missing required fields', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      supabase.from.mockReturnValue(mockSessionChain);
      handleFileRecord.mockRejectedValue(new Error('Missing required fields'));

      const response = await request(app)
        .post('/api/files/metadata')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error saving file metadata');
    });

    it('should handle database error', async () => {
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
      handleFileRecord.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/files/metadata')
        .set('Authorization', 'Bearer valid-token')
        .send(fileData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error saving file metadata');
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

  describe('GET /api/files/dates-metadata', () => {
    it('should return file dates metadata', async () => {
      const mockFile = {
        creation_date: '2024-01-01',
        modified_date: '2024-01-02'
      };

      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockFileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockFileChain);

      const response = await request(app)
        .get('/api/files/dates-metadata?fileId=123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFile);
    });

    it('should handle missing fileId', async () => {
      const response = await request(app)
        .get('/api/files/dates-metadata')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File ID is required');
    });

    it('should handle invalid session', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from.mockReturnValue(mockSessionChain);

      const response = await request(app)
        .get('/api/files/dates-metadata?fileId=123')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired session');
    });
  });

  describe('POST /api/files/share-with-neurosurgeon', () => {
    it('should share file successfully', async () => {
      const shareData = {
        fileId: '123',
        email: 'neurosurgeon@example.com',
        designationData: { some: 'data' },
        localizationData: { some: 'data' }
      };

      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockCurrentUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: 'Dr. Smith' }, error: null })
      };

      const mockTargetUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 2 }, error: null })
      };

      const mockFileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { 
            file_id: '123',
            patient_id: 'patient1',
            creation_date: '2024-01-01'
          }, 
          error: null 
        })
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { file_id: '456' }, 
          error: null 
        })
      };

      const mockAssignmentChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      const mockDesignationChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockCurrentUserChain)
        .mockReturnValueOnce(mockTargetUserChain)
        .mockReturnValueOnce(mockFileChain)
        .mockReturnValueOnce(mockInsertChain)
        .mockReturnValueOnce(mockAssignmentChain)
        .mockReturnValueOnce(mockDesignationChain);

      const response = await request(app)
        .post('/api/files/share-with-neurosurgeon')
        .set('Authorization', 'Bearer valid-token')
        .send(shareData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File shared successfully');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/files/share-with-neurosurgeon')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File ID and email are required');
    });

    it('should handle user not found', async () => {
      const shareData = {
        fileId: '123',
        email: 'nonexistent@example.com'
      };

      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockCurrentUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: 'Dr. Smith' }, error: null })
      };

      const mockTargetUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockCurrentUserChain)
        .mockReturnValueOnce(mockTargetUserChain);

      const response = await request(app)
        .post('/api/files/share-with-neurosurgeon')
        .set('Authorization', 'Bearer valid-token')
        .send(shareData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/shared-files', () => {
    it('should return shared files', async () => {
      const mockAssignments = [
        { patient_id: '1' },
        { patient_id: '2' }
      ];

      const mockFiles = [
        {
          patient_id: '1',
          file_id: 1,
          filename: 'test1.txt',
          creation_date: '2024-01-01',
          modified_date: '2024-01-02',
          owner_user_id: 1
        },
        {
          patient_id: '2',
          file_id: 2,
          filename: 'test2.txt',
          creation_date: '2024-01-01',
          modified_date: '2024-01-02',
          owner_user_id: 1
        }
      ];

      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockAssignmentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ data: mockAssignments, error: null })
      };

      const mockFilesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockFiles, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockAssignmentsChain)
        .mockReturnValueOnce(mockFilesChain);

      const response = await request(app)
        .get('/api/shared-files')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.patients).toBeDefined();
      expect(response.body.patients.length).toBe(2);
    });

    it('should return empty array when no shared files', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockAssignmentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockAssignmentsChain);

      const response = await request(app)
        .get('/api/shared-files')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.patients).toEqual([]);
    });
  });

  describe('POST /api/mark-file-seen/:fileId', () => {
    it('should mark file as seen', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      // Create a mock that tracks the eq calls
      const eqCalls = [];
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field, value) => {
          eqCalls.push([field, value]);
          return mockUpdateChain;
        }),
        mockResolvedValue: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      // Mock the from() calls in sequence
      supabase.from
        .mockReturnValueOnce(mockSessionChain)  // First call for sessions
        .mockReturnValueOnce(mockUpdateChain);  // Second call for file_assignments

      const response = await request(app)
        .post('/api/mark-file-seen/123')
        .set('Authorization', 'Bearer valid-token');

      // Verify the mock calls
      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(supabase.from).toHaveBeenCalledWith('file_assignments');
      expect(mockUpdateChain.update).toHaveBeenCalledWith({ has_seen: true });
      expect(eqCalls[0]).toEqual(['user_id', 1]);
      expect(eqCalls[1]).toEqual(['file_id', '123']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle missing fileId', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      supabase.from.mockReturnValue(mockSessionChain);

      const response = await request(app)
        .post('/api/mark-file-seen/ ')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });

    it('should handle database error', async () => {
      const mockSessionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { user_id: 1 }, error: null })
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Database error') })
      };

      supabase.from
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockUpdateChain);

      const response = await request(app)
        .post('/api/mark-file-seen/123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error marking file as seen');
    });
  });
});
