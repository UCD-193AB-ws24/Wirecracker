import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import GoogleAuthSuccess from '../GoogleAuthSuccess';
import { MemoryRouter } from 'react-router-dom';

// Mock the useNavigate hook to detect and test for redirection
const mockNavigate = vi.fn();

describe('GoogleAuthSuccess Component', () => {
  beforeEach(() => {
    // Mock window.location.search
    delete window.location;
    window.location = { search: '' };

    // Mock localStorage
    global.localStorage = {
      setItem: vi.fn(),
    };

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading message', () => {
    const { getByText } = render(
      <MemoryRouter>
        <GoogleAuthSuccess />
      </MemoryRouter>
    );
    expect(getByText('Signing in...')).toBeDefined();
  });

  test('stores token and navigates to home when token exists in URL', () => {
    const testToken = 'test-token-123';
    window.location.search = `?token=${testToken}`;

    render(
      <MemoryRouter>
        <GoogleAuthSuccess />
      </MemoryRouter>
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('token', testToken);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to home even when no token exists in URL', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <GoogleAuthSuccess />
      </MemoryRouter>
    );

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles multiple query parameters correctly', () => {
    const testToken = 'test-token-456';
    window.location.search = `?foo=bar&token=${testToken}&baz=qux`;

    render(
      <MemoryRouter>
        <GoogleAuthSuccess />
      </MemoryRouter>
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('token', testToken);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
