import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase } from '../routes/utils.js';

// Mock Supabase client
vi.mock('../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  genSalt: vi.fn(),
  hash: vi.fn(),
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ data: null, error: null });
      
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return token and user info for valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword',
      };
      
      supabase.from().select().eq().single.mockResolvedValue({ data: mockUser, error: null });
      supabase.from().insert.mockResolvedValue({ data: null, error: null });
      
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'correctpassword', rememberMe: true });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('POST /auth/signup', () => {
    it('should return 400 if user already exists', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: { id: 1 }, 
        error: null 
      });
      
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should create new user successfully', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });
      
      supabase.from().insert.mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      });
      
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'new@example.com',
          name: 'New User',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('verificationCode');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should return 404 for non-existent user', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: null 
      });
      
      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          email: 'nonexistent@example.com',
          code: '123456'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should verify email successfully', async () => {
      const mockUser = { id: 1 };
      const mockVerification = { id: 1, code: '123456' };
      
      supabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockVerification, error: null });
      
      supabase.from().delete().eq().mockResolvedValue({ data: null, error: null });
      
      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          email: 'test@example.com',
          code: '123456'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified. You can now log in.');
    });
  });
}); 