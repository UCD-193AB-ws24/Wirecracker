import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
  join: vi.fn((...args) => args.join('/')),
}));

describe('Docs Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('GET /api/usage-docs/:docPath', () => {
    it('should return documentation content', async () => {
      const mockContent = '# Test Documentation\n\nThis is a test doc.';
      const safePath = 'test-doc';

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);

      const response = await request(app)
        .get(`/api/usage-docs/${safePath}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe(mockContent);
      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(path.join).toHaveBeenCalled();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should sanitize path to prevent directory traversal', async () => {
      const mockContent = '# Test Documentation\n\nThis is a test doc.';
      const safePath = 'test-doc';
      const unsafePath = '../../../test-doc';

      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockReturnValue(mockContent);

      const response = await request(app)
        .get(`/api/usage-docs/${unsafePath}`);

      expect(response.status).toBe(404);
      expect(response.text).toContain('Cannot GET');
    });

    it('should return 404 for non-existent documentation', async () => {
      const docPath = 'non-existent';

      fs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get(`/api/usage-docs/${docPath}`);

      expect(response.status).toBe(404);
      expect(response.text).toContain('404');
      expect(response.text).toContain('Documentation Not Found');
    });

    it('should handle file system errors', async () => {
      const docPath = 'test-doc';

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const response = await request(app)
        .get(`/api/usage-docs/${docPath}`);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error loading documentation');
    });

    it('should use correct project root in production', async () => {
      process.env.NODE_ENV = 'production';
      const docPath = 'test-doc';

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('content');

      await request(app)
        .get(`/api/usage-docs/${docPath}`);

      // The route joins the paths in sequence, so we need to check each join call
      expect(path.join).toHaveBeenCalledWith(process.cwd(), 'docs');
      expect(path.join).toHaveBeenCalledWith(expect.any(String), `${docPath}.md`);
    });
  });
}); 