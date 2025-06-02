import { vi } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.EMAIL_FROM = 'test@example.com';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

// Mock Resend client
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in test output
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn(); 