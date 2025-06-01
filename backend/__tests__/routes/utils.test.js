import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase, TABLE_NAMES, generateAcronym, insertRegionsAndGetIds, handleFileRecord } from '../routes/utils.js';

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
      expect(generateAcronym('Test Description XYZ')).toBe('TDX');
      expect(generateAcronym('ABC DEF GHI')).toBe('ADG');
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
      
      supabase.from().select().mockResolvedValue({ 
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
      
      supabase.from().select().mockResolvedValue({ 
        data: existingRegions, 
        error: null 
      });
      
      supabase.from().insert().select().mockResolvedValue({ 
        data: newRegions, 
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
      
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: existingFile, 
        error: null 
      });
      
      supabase.from().update().eq().mockResolvedValue({ 
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
      
      expect(supabase.from().update).toHaveBeenCalled();
    });

    it('should create new file record', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });
      
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { user_id: 1 }, 
        error: null 
      });
      
      supabase.from().insert().mockResolvedValue({ 
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
      
      expect(supabase.from().insert).toHaveBeenCalled();
    });

    it('should throw error for invalid session', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });
      
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
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