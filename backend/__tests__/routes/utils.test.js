import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase, TABLE_NAMES, generateAcronym, insertRegionsAndGetIds, handleFileRecord } from '../../routes/utils.js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
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
}); 