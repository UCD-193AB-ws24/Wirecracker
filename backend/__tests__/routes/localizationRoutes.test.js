import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase, saveLocalizationToDatabase } from '../routes/utils.js';

// Mock Supabase client and saveLocalizationToDatabase
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
  saveLocalizationToDatabase: vi.fn(),
}));

describe('Localization Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /electrode-label-descriptions', () => {
    it('should return electrode label descriptions', async () => {
      const mockDescriptions = [
        { id: 1, label: 'Test Label 1', description: 'Description 1' },
        { id: 2, label: 'Test Label 2', description: 'Description 2' }
      ];

      supabase.from().select().mockResolvedValue({ 
        data: mockDescriptions, 
        error: null 
      });

      const response = await request(app)
        .get('/electrode-label-descriptions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        electrodeLabelDescriptions: mockDescriptions
      });
    });

    it('should handle database errors', async () => {
      supabase.from().select().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const response = await request(app)
        .get('/electrode-label-descriptions');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('POST /save-localization', () => {
    const validLocalizationData = {
      electrodes: {
        'E1': { x: 1, y: 2, z: 3 },
        'E2': { x: 4, y: 5, z: 6 }
      },
      fileId: 1
    };

    it('should return 400 for missing electrodes data', async () => {
      const response = await request(app)
        .post('/save-localization')
        .send({ fileId: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing electrodes data');
    });

    it('should return 400 for missing file ID', async () => {
      const response = await request(app)
        .post('/save-localization')
        .send({ electrodes: validLocalizationData.electrodes });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing file ID');
    });

    it('should return 400 for empty electrodes data', async () => {
      const response = await request(app)
        .post('/save-localization')
        .send({ electrodes: {}, fileId: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Electrodes data is empty');
    });

    it('should delete existing localizations before saving new ones', async () => {
      const existingLocalizations = [
        { id: 1, file_id: 1 },
        { id: 2, file_id: 1 }
      ];

      supabase.from().select().eq().mockResolvedValue({ 
        data: existingLocalizations, 
        error: null 
      });

      supabase.from().delete().eq().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      saveLocalizationToDatabase.mockResolvedValue();

      const response = await request(app)
        .post('/save-localization')
        .send(validLocalizationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(saveLocalizationToDatabase).toHaveBeenCalledWith(
        validLocalizationData.electrodes,
        validLocalizationData.fileId
      );
    });

    it('should handle errors when deleting existing localizations', async () => {
      supabase.from().select().eq().mockResolvedValue({ 
        data: [{ id: 1, file_id: 1 }], 
        error: null 
      });

      supabase.from().delete().eq().mockResolvedValue({ 
        data: null, 
        error: new Error('Delete error') 
      });

      const response = await request(app)
        .post('/save-localization')
        .send(validLocalizationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to update existing localization data');
    });

    it('should handle errors when saving localization data', async () => {
      supabase.from().select().eq().mockResolvedValue({ 
        data: [], 
        error: null 
      });

      saveLocalizationToDatabase.mockRejectedValue(new Error('Save error'));

      const response = await request(app)
        .post('/save-localization')
        .send(validLocalizationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Save error');
    });
  });
}); 