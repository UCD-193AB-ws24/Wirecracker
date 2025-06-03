// Mock the utils module first
vi.mock('../../routes/utils.js', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import searchRoutes from '../../routes/searchRoutes.js';

// Create test app
const app = express();
app.use(bodyParser.json());
app.use('/api', searchRoutes);

describe('Search API Routes', () => {
    let supabase;

    beforeEach(async () => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        // Get fresh reference to mocked supabase
        const utils = await import('../../routes/utils.js');
        supabase = utils.supabase;
    });

    describe('POST /api/search', () => {
        it('should handle empty query gracefully', async () => {
            // Mock empty results for all queries
            supabase.from.mockImplementation(() => ({
                select: () => ({
                    or: () => ({
                        in: () => ({
                            data: [],
                            error: null
                        })
                    })
                })
            }));

            const response = await request(app)
                .post('/api/search')
                .send({ query: '' });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                cort: [],
                gm: [],
                functions: [],
                tests: []
            });
        });

        it('should handle invalid hemisphere values', async () => {
            // Mock empty results for all queries
            supabase.from.mockImplementation(() => ({
                select: () => ({
                    or: () => ({
                        in: () => ({
                            data: [],
                            error: null
                        })
                    })
                })
            }));

            const response = await request(app)
                .post('/api/search')
                .send({ query: 'test', hemisphere: ['invalid'] });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                cort: [],
                gm: [],
                functions: [],
                tests: []
            });
        });
    });

    describe('POST /api/suggest', () => {
        it('should return suggestions', async () => {
            const mockSuggestions = [
                { suggestion: 'Broca\'s Area' },
                { suggestion: 'Broca\'s Region' }
            ];

            supabase.rpc.mockImplementation(() => ({
                order: () => ({
                    limit: () => ({
                        data: mockSuggestions,
                        error: null
                    })
                })
            }));

            const response = await request(app)
                .post('/api/suggest')
                .send({ query: 'broca' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.suggestions)).toBe(true);
            expect(response.body.suggestions).toHaveLength(2);
        });

        it('should handle empty query', async () => {
            const response = await request(app)
                .post('/api/suggest')
                .send({ query: '' });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/lobe-options', () => {
        it('should return lobe options', async () => {
            const mockLobes = [
                { lobe: 'Frontal' },
                { lobe: 'Parietal' },
                { lobe: 'Temporal' }
            ];

            supabase.from.mockImplementation(() => ({
                select: () => ({
                    not: () => ({
                        not: () => ({
                            order: () => ({
                                data: mockLobes,
                                error: null
                            })
                        })
                    })
                })
            }));

            const response = await request(app).get('/api/lobe-options');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.lobes)).toBe(true);
            expect(response.body.lobes).toHaveLength(3);
        });

        it('should handle database errors gracefully', async () => {
            supabase.from.mockImplementation(() => ({
                select: () => ({
                    not: () => ({
                        not: () => ({
                            order: () => ({
                                data: null,
                                error: new Error('Database error')
                            })
                        })
                    })
                })
            }));

            const response = await request(app).get('/api/lobe-options');
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
});
