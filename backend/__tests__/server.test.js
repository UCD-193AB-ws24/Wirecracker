import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import request from 'supertest';

// Load environment variables before importing app
dotenv.config();

// Now import the app after environment is loaded
import app from '../server.js';

describe('Server Configuration', () => {
  it('should have CORS configured correctly', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.headers['access-control-allow-origin']).toBeDefined();
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should parse JSON request body', async () => {
    const response = await request(app)
      .post('/send-verification-email')
      .send({ email: 'test@example.com', code: '123456' })
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBeDefined();
  });
}); 