import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { supabase } from '../../routes/utils.js';

// Mock Supabase client
vi.mock('../../routes/utils.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis()
    })),
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    genSalt: vi.fn(),
    hash: vi.fn(),
  }
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from.mockReturnValueOnce(mockUserCheck);
      const bcrypt = (await import('bcrypt')).default;
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
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
      
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
      };

      // Create mock chain for session insert
      const mockSessionInsert = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockUserCheck)
        .mockReturnValueOnce(mockSessionInsert);

      const bcrypt = (await import('bcrypt')).default;
      bcrypt.compare.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'correctpassword', rememberMe: true });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 if user already exists', async () => {
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
      };

      supabase.from.mockReturnValueOnce(mockUserCheck);
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should create new user successfully', async () => {
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      // Create mock chain for user insert
      const mockUserInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
      };

      // Create mock chain for verification code insert
      const mockCodeInsert = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockUserCheck)
        .mockReturnValueOnce(mockUserInsert)
        .mockReturnValueOnce(mockCodeInsert);

      const bcrypt = (await import('bcrypt')).default;
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const response = await request(app)
        .post('/api/auth/signup')
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

  describe('POST /api/auth/verify-email', () => {
    it('should return 404 for non-existent user', async () => {
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from.mockReturnValueOnce(mockUserCheck);
      
      const response = await request(app)
        .post('/api/auth/verify-email')
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
      
      // Create mock chain for user check
      const mockUserCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
      };

      // Create mock chain for verification check
      const mockVerificationCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVerification, error: null })
      };

      // Create mock chain for verification delete
      const mockVerificationDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockUserCheck)
        .mockReturnValueOnce(mockVerificationCheck)
        .mockReturnValueOnce(mockVerificationDelete);
      
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'test@example.com',
          code: '123456'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified. You can now log in.');
    });
  });
}); 