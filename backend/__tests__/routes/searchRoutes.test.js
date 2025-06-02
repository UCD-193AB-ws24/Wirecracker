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
        // it('should return search results for a valid query', async () => {
        //     // Create mock data with proper relationships
        //     const mockCortData = [
        //         { 
        //             id: 1, 
        //             name: 'Frontal Cortex', 
        //             hemisphere: 'l', 
        //             lobe: 'Frontal',
        //             cort_gm: [
        //                 {
        //                     gm: {
        //                         id: 1,
        //                         name: 'Gray Matter 1',
        //                         cort_gm: [
        //                             {
        //                                 cort: {
        //                                     id: 1,
        //                                     name: 'Frontal Cortex',
        //                                     hemisphere: 'l',
        //                                     lobe: 'Frontal'
        //                                 },
        //                                 reference: {
        //                                     id: 1,
        //                                     authors: 'Test Author',
        //                                     publication_date: '2023',
        //                                     title: 'Test Title',
        //                                     publisher: 'Test Publisher',
        //                                     isbn_issn_doi: '123456789'
        //                                 }
        //                             }
        //                         ],
        //                         gm_function: [
        //                             {
        //                                 function: {
        //                                     id: 1,
        //                                     name: 'Function 1',
        //                                     description: 'Test Function',
        //                                     gm_function: [],
        //                                     function_test: []
        //                                 },
        //                                 reference: {
        //                                     id: 1,
        //                                     authors: 'Test Author',
        //                                     publication_date: '2023',
        //                                     title: 'Test Title',
        //                                     publisher: 'Test Publisher',
        //                                     isbn_issn_doi: '123456789'
        //                                 }
        //                             }
        //                         ]
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ]
        //         }
        //     ];

        //     const mockGmData = [
        //         {
        //             id: 1,
        //             name: 'Gray Matter 1',
        //             cort_gm: [
        //                 {
        //                     cort: {
        //                         id: 1,
        //                         name: 'Frontal Cortex',
        //                         hemisphere: 'l',
        //                         lobe: 'Frontal'
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ],
        //             gm_function: [
        //                 {
        //                     function: {
        //                         id: 1,
        //                         name: 'Function 1',
        //                         description: 'Test Function',
        //                         gm_function: [],
        //                         function_test: []
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ]
        //         }
        //     ];

        //     const mockFunctionData = [
        //         {
        //             id: 1,
        //             name: 'Function 1',
        //             description: 'Test Function',
        //             gm_function: [
        //                 {
        //                     gm: {
        //                         id: 1,
        //                         name: 'Gray Matter 1'
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ],
        //             function_test: [
        //                 {
        //                     test: {
        //                         id: 1,
        //                         name: 'Test 1',
        //                         description: 'Test Description'
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ]
        //         }
        //     ];

        //     const mockTestData = [
        //         {
        //             id: 1,
        //             name: 'Test 1',
        //             description: 'Test Description',
        //             function_test: [
        //                 {
        //                     function: {
        //                         id: 1,
        //                         name: 'Function 1',
        //                         description: 'Test Function'
        //                     },
        //                     reference: {
        //                         id: 1,
        //                         authors: 'Test Author',
        //                         publication_date: '2023',
        //                         title: 'Test Title',
        //                         publisher: 'Test Publisher',
        //                         isbn_issn_doi: '123456789'
        //                     }
        //                 }
        //             ]
        //         }
        //     ];

        //     // Mock Supabase responses for all queries
        //     supabase.from.mockImplementation((table) => {
        //         const mockResponses = {
        //             cort: {
        //                 select: () => ({
        //                     or: () => ({
        //                         in: () => ({
        //                             data: mockCortData,
        //                             error: null
        //                         })
        //                     })
        //                 })
        //             },
        //             gm: {
        //                 select: () => ({
        //                     or: () => ({
        //                         data: mockGmData,
        //                         error: null
        //                     })
        //                 })
        //             },
        //             function: {
        //                 select: () => ({
        //                     or: () => ({
        //                         data: mockFunctionData,
        //                         error: null
        //                     })
        //                 })
        //             },
        //             test: {
        //                 select: () => ({
        //                     or: () => ({
        //                         data: mockTestData,
        //                         error: null
        //                     })
        //                 })
        //             }
        //         };

        //         return mockResponses[table] || {
        //             select: () => ({
        //                 or: () => ({
        //                     data: [],
        //                     error: null
        //                 })
        //             })
        //         };
        //     });

        //     const response = await request(app)
        //         .post('/api/search')
        //         .send({ query: 'frontal', hemisphere: ['left'], lobe: ['Frontal'] });

        //     expect(response.status).toBe(200);
        //     expect(response.body).toHaveProperty('cort');
        //     expect(response.body).toHaveProperty('gm');
        //     expect(response.body).toHaveProperty('functions');
        //     expect(response.body).toHaveProperty('tests');
        // });

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
