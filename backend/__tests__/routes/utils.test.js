import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase, TABLE_NAMES, generateAcronym, insertRegionsAndGetIds, handleFileRecord, saveLocalizationToDatabase, sendShareNotification } from '../../routes/utils.js';
import { Resend } from 'resend';

// Mock Resend client
const mockResend = vi.hoisted(() => ({
  emails: {
    send: vi.fn()
  }
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => mockResend)
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
  })),
}));

describe('Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TABLE_NAMES', () => {
    it('should contain all required table names', () => {
      const requiredTables = [
        'cort_gm',
        'cort',
        'function',
        'function_test',
        'gm',
        'gm_function',
        'reference',
        'stimulation',
        'tag',
        'test',
        'test_tag',
        'electrode',
        'localization',
        'region_name'
      ];
      
      requiredTables.forEach(table => {
        expect(TABLE_NAMES).toContain(table);
      });
    });
  });

  describe('generateAcronym', () => {
    it('should extract uppercase letters from description', () => {
      expect(generateAcronym('Test Description XYZ')).toBe('TDXYZ');
      expect(generateAcronym('ABC DEF GHI')).toBe('ABCDEFGHI');
    });

    it('should return empty string for no uppercase letters', () => {
      expect(generateAcronym('test description')).toBe('');
      expect(generateAcronym('')).toBe('');
    });
  });

  describe('insertRegionsAndGetIds', () => {
    it('should handle existing regions', async () => {
      const existingRegions = [
        { id: 1, name: 'Region A' },
        { id: 2, name: 'Region B' }
      ];
      
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      });
      
      supabase.from = mockFrom;
      mockSelect.mockResolvedValue({ 
        data: existingRegions, 
        error: null 
      });
      
      const result = await insertRegionsAndGetIds(['Region A', 'Region B']);
      
      expect(result).toEqual({
        'Region A': 1,
        'Region B': 2
      });
    });

    it('should insert new regions', async () => {
      const existingRegions = [{ id: 1, name: 'Region A' }];
      const newRegions = [{ id: 2, name: 'Region C' }];
      
      const mockSelect = vi.fn().mockReturnThis();
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ 
          data: newRegions, 
          error: null 
        })
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      });
      
      supabase.from = mockFrom;
      
      // First call for existing regions
      mockSelect.mockResolvedValueOnce({ 
        data: existingRegions, 
        error: null 
      });
      
      const result = await insertRegionsAndGetIds(['Region A', 'Region C']);
      
      expect(result).toEqual({
        'Region A': 1,
        'Region C': 2
      });
    });
  });

  describe('handleFileRecord', () => {
    it('should update existing file record', async () => {
      const existingFile = {
        file_id: '123',
        filename: 'old.txt',
        modified_date: '2024-01-01'
      };
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: existingFile, 
            error: null 
          })
        })
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ 
          data: null, 
          error: null 
        })
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockReturnThis(),
        update: mockUpdate,
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      });
      
      supabase.from = mockFrom;
      
      await handleFileRecord(
        '123',
        'new.txt',
        '2024-01-01',
        '2024-01-02',
        'token',
        'patient1'
      );
      
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should create new file record', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          })
        })
      });
      const mockInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: null 
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      });
      
      supabase.from = mockFrom;
      
      // Mock file check to return no existing file
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          })
        })
      });
      
      // Mock session check to return valid user
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { user_id: 1 }, 
            error: null 
          })
        })
      });
      
      // Mock file insert
      mockInsert.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      });
      
      // Mock file assignments insert
      mockInsert.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      });
      
      await handleFileRecord(
        '123',
        'new.txt',
        '2024-01-01',
        '2024-01-02',
        'token',
        'patient1'
      );
      
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenNthCalledWith(1, {
        file_id: '123',
        owner_user_id: 1,
        filename: 'new.txt',
        creation_date: '2024-01-01',
        modified_date: '2024-01-02',
        patient_id: 'patient1'
      });
      expect(mockInsert).toHaveBeenNthCalledWith(2, {
        file_id: '123',
        user_id: 1,
        patient_id: 'patient1',
        role: 'owner',
        has_seen: true,
        is_completed: false,
        completed_at: null
      });
    });

    it('should throw error for invalid session', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          })
        })
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      });
      
      supabase.from = mockFrom;
      
      // Mock session check to return no session
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          })
        })
      });
      
      await expect(handleFileRecord(
        '123',
        'new.txt',
        '2024-01-01',
        '2024-01-02',
        'invalid-token',
        'patient1'
      )).rejects.toThrow('Invalid or expired session');
    });
  });

  describe('saveLocalizationToDatabase', () => {
    beforeEach(() => {
      // Mock the base Supabase query chain
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn()
      };

      // Mock the Supabase client
      supabase.from = vi.fn().mockImplementation((table) => {
        switch (table) {
          case 'electrode':
            return {
              ...baseMock,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 1, label: 'E1' }],
                  error: null
                })
              })
            };
          case 'localization':
            return {
              ...baseMock,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [
                    { id: 101, electrode_id: 1, contact: '1', tissue_type: 'GM', region_id: 1, file_id: 123 },
                    { id: 102, electrode_id: 1, contact: '2', tissue_type: 'WM', region_id: 2, file_id: 123 }
                  ],
                  error: null
                })
              }),
              select: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 100 }],
                error: null
              })
            };
          case 'region_name':
            return {
              ...baseMock,
              select: vi.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'Region A' },
                  { id: 2, name: 'Region B' }
                ],
                error: null
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [
                    { id: 1, name: 'Region A' },
                    { id: 2, name: 'Region B' }
                  ],
                  error: null
                })
              })
            };
          default:
            return baseMock;
        }
      });
    });

    it('should save localization data successfully', async () => {
      const mockData = {
        'E1': {
          description: 'Electrode 1',
          type: 'DIXI',
          '1': {
            associatedLocation: 'GM',
            contactDescription: 'Region A'
          },
          '2': {
            associatedLocation: 'WM',
            contactDescription: 'Region B'
          }
        }
      };

      const result = await saveLocalizationToDatabase(mockData, 123);

      expect(result).toEqual({
        electrodeCount: 1,
        localizationCount: 2,
        fileId: 123
      });
    });

    it('should handle GM/GM case correctly', async () => {
      const mockData = {
        'E1': {
          description: 'Electrode 1',
          type: 'DIXI',
          '1': {
            associatedLocation: 'GM/GM',
            contactDescription: 'Region A+Region B'
          }
        }
      };

      const result = await saveLocalizationToDatabase(mockData, 123);

      expect(result).toEqual({
        electrodeCount: 1,
        localizationCount: 2,
        fileId: 123
      });
    });

    it('should handle database error', async () => {
      const mockData = {
        'E1': {
          description: 'Electrode 1',
          type: 'DIXI',
          '1': {
            associatedLocation: 'GM',
            contactDescription: 'Region A'
          }
        }
      };

      // Override the mock to simulate a database error
      supabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'electrode') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error')
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn()
        };
      });

      await expect(saveLocalizationToDatabase(mockData, 123)).rejects.toThrow('Database error');
    });

    it('should handle invalid file ID', async () => {
      const mockData = {
        'E1': {
          description: 'Electrode 1',
          type: 'DIXI',
          '1': {
            associatedLocation: 'GM',
            contactDescription: 'Region A'
          }
        }
      };

      await expect(saveLocalizationToDatabase(mockData, 'invalid')).rejects.toThrow('Invalid file ID');
    });
  });

  describe('sendShareNotification', () => {
    it('should send email notification successfully', async () => {
      const mockEmailResponse = { id: '123', to: 'test@example.com' };
      mockResend.emails.send.mockResolvedValue({ data: mockEmailResponse, error: null });

      const result = await sendShareNotification(
        'test@example.com',
        'John Doe',
        'Localization',
        'patient123',
        '2024-01-01'
      );

      expect(result).toEqual(mockEmailResponse);
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Wirecracker <send@wirecracker.com>',
        to: 'test@example.com',
        subject: 'Wirecracker: Localization shared with you',
        html: `
                <p>John Doe has shared a Localization with you for patient PAT-12/31/23.</p>
                <p>Please log into <a href="https://wirecracker.com">wirecracker.com</a> to review the files.</p>
            `
      });
    });

    it('should handle email sending error', async () => {
      const mockError = new Error('Failed to send email');
      mockResend.emails.send.mockResolvedValue({ data: null, error: mockError });

      await expect(sendShareNotification(
        'test@example.com',
        'John Doe',
        'Localization',
        'patient123',
        '2024-01-01'
      )).rejects.toThrow('Failed to send email');
    });

    it('should format patient ID and date correctly', async () => {
      mockResend.emails.send.mockResolvedValue({ data: { id: '123' }, error: null });

      await sendShareNotification(
        'test@example.com',
        'John Doe',
        'Localization',
        'patient123',
        '2024-01-01'
      );

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Wirecracker <send@wirecracker.com>',
        to: 'test@example.com',
        subject: 'Wirecracker: Localization shared with you',
        html: `
                <p>John Doe has shared a Localization with you for patient PAT-12/31/23.</p>
                <p>Please log into <a href="https://wirecracker.com">wirecracker.com</a> to review the files.</p>
            `
      });
    });
  });
}); 