import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Signup from '../Signup';
import { MemoryRouter } from 'react-router-dom';
import { signUp, verifyEmail } from '../../auth';

// Mock the useError hook
const mockShowError = vi.fn();
vi.mock('../../context/ErrorContext', () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}));

// Mock dependencies
vi.mock('../../auth', () => ({
  signUp: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock('../../App', () => ({
  GoogleSignInButton: () => <div>GoogleSignInButton</div>,
}));

// Mock navigation to test redirection
const mockNavigate = vi.fn();

describe('Signup Component', () => {
  beforeEach(() => {
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

  test('renders the signup form initially', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    expect(screen.getByText('Create your account')).toBeDefined();
    expect(screen.getByPlaceholderText('Full Name')).toBeDefined();
    expect(screen.getByPlaceholderText('Email address')).toBeDefined();
    expect(screen.getByPlaceholderText('Password')).toBeDefined();
    expect(screen.getByText('Sign up')).toBeDefined();
    expect(screen.getByText('Or continue with')).toBeDefined();
    expect(screen.getByText('GoogleSignInButton')).toBeDefined();
    expect(screen.getByText('Sign in')).toBeDefined();
  });

  test('updates form state on input change', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');

    act(() => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('validates email format before signup', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByText('Sign up');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
    });

    expect(mockShowError).toHaveBeenCalledWith('Please enter a valid email address');
    expect(signUp).not.toHaveBeenCalled();
  });

  test('handles successful signup and shows verification form', async () => {
    signUp.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    // Fill in the form
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign up');

    act(() => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
    });

    await act(async () => {
      // Wait for state updates
    });

    // Verify verification form is shown
    expect(screen.getByText('Verify your email')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter Verification Code')).toBeDefined();
    expect(screen.getByText('Verify Email')).toBeDefined();
    expect(screen.getByText("We've sent a verification code to your email")).toBeDefined();
  });

  test('handles signup error', async () => {
    const errorMessage = 'Email already in use';
    signUp.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    // Fill in valid form
    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByText('Sign up');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
    });

    await act(async () => {
      // Wait for error handling
    });

    expect(mockShowError).toHaveBeenCalledWith(errorMessage);
    expect(screen.queryByText('Verify your email')).toBeNull(); // Verification form shouldn't appear
  });

  test('handles successful verification', async () => {
    // First mock successful signup
    signUp.mockResolvedValueOnce();

    // Then mock successful verification
    verifyEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    // Complete signup first
    const emailInput = screen.getByPlaceholderText('Email address');
    const signupButton = screen.getByText('Sign up');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(signupButton);
    });

    await act(async () => {
      // Wait for signup to complete
    });

    // Now test verification
    const codeInput = screen.getByPlaceholderText('Enter Verification Code');
    const verifyButton = screen.getByText('Verify Email');

    act(() => {
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);
    });

    expect(await screen.findByText('Verification successful! You can log in now.')).toBeDefined();

    // Check navigation after timeout
    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles verification error', async () => {
    // First mock successful signup
    signUp.mockResolvedValueOnce();

    // Then mock failed verification
    const errorMessage = 'Invalid verification code';
    verifyEmail.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    // Complete signup first
    const emailInput = screen.getByPlaceholderText('Email address');
    const signupButton = screen.getByText('Sign up');

    act(() => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(signupButton);
    });

    await act(async () => {
      // Wait for signup to complete
    });

    // Now test verification
    const verifyButton = screen.getByText('Verify Email');

    await act(async () => {
      fireEvent.click(verifyButton);
    });

    expect(mockShowError).toHaveBeenCalledWith(errorMessage);
    expect(screen.queryByText('Verification successful!')).toBeNull();
  });

  test('has a link to login page', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    const loginLink = screen.getByText('Sign in');
    expect(loginLink).toBeDefined();
    expect(loginLink.href).toContain('/login');
  });
});
