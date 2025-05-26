import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Login from '../Login';
import { MemoryRouter } from 'react-router-dom';
import { login } from '../../auth';

// Mock the useError hook
const mockShowError = vi.fn();
vi.mock('../../context/ErrorContext', () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}));

// Mock dependencies
vi.mock('../../auth', () => ({
  login: vi.fn(),
}));

vi.mock('../../App', () => ({
  GoogleSignInButton: () => <div>GoogleSignInButton</div>,
}));

// mock navigation to test redirect
const mockNavigate = vi.fn();

describe('Login Component', () => {

  beforeEach(() => {
    global.localStorage = {
      setItem: vi.fn(),
    };

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

  test('renders the login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Sign in to your account')).toBeDefined();
    expect(screen.getByPlaceholderText('Email address')).toBeDefined();
    expect(screen.getByPlaceholderText('Password')).toBeDefined();
    expect(screen.getByText('Sign in')).toBeDefined();
    expect(screen.getByText('Or continue with')).toBeDefined();
    expect(screen.getByText('GoogleSignInButton')).toBeDefined();
  });

  test('updates email and password state on input change', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('toggles remember me checkbox', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.checked).toBe(false);

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.checked).toBe(true);
  });

  test('handles successful login', async () => {
    login.mockResolvedValueOnce({ token: 'fake-token' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign in');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
    });

    expect(await screen.findByText('Login successful')).toBeDefined();
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-token');

    // Check navigation after timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    login.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByText('Sign in');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockShowError).toHaveBeenCalledWith(errorMessage);
  });

  test('has a link to signup page', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const signupLink = screen.getByText('create a new account');
    expect(signupLink).toBeDefined();
    expect(signupLink.href).toContain('/signup');
  });
});
