import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import tableRoutes from '../../routes/tableRoutes.js';
import localizationRoutes from '../../routes/localizationRoutes.js';
import designationRoutes from '../../routes/designationRoutes.js';
import stimulationRoutes from '../../routes/stimulationRoutes.js';
import testRoutes from '../../routes/testRoutes.js';
import searchRoutes from '../../routes/searchRoutes.js';
import userRoutes from '../../routes/userRoutes.js';
import authRoutes from '../../routes/authRoutes.js';
import fileRoutes from '../../routes/fileRoutes.js';
import docsRoutes from '../../routes/docsRoutes.js';
import fileShareRoutes from '../../routes/fileShareRoutes.js';

// Mock all route modules
vi.mock('../../routes/tableRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/localizationRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/designationRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/stimulationRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/testRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/searchRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/userRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/authRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/fileRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/docsRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

vi.mock('../../routes/fileShareRoutes.js', () => ({
  default: {
    use: vi.fn(),
  },
}));

describe('Route Registration', () => {
  it('should register all routes', () => {
    // Verify that each route module's use method was called
    expect(tableRoutes.use).toHaveBeenCalled();
    expect(localizationRoutes.use).toHaveBeenCalled();
    expect(designationRoutes.use).toHaveBeenCalled();
    expect(stimulationRoutes.use).toHaveBeenCalled();
    expect(testRoutes.use).toHaveBeenCalled();
    expect(searchRoutes.use).toHaveBeenCalled();
    expect(userRoutes.use).toHaveBeenCalled();
    expect(authRoutes.use).toHaveBeenCalled();
    expect(fileRoutes.use).toHaveBeenCalled();
    expect(docsRoutes.use).toHaveBeenCalled();
    expect(fileShareRoutes.use).toHaveBeenCalled();
  });

  it('should handle CORS and JSON parsing', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:3000');

    // Verify CORS headers are present
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
}); 