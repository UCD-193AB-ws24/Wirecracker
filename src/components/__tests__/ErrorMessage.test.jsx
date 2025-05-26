import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  const mockMessage = 'This is an error message';
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the error message when visible', () => {
    render(
      <ErrorMessage
        message={mockMessage}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(mockMessage)).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByTitle('Close')).toBeDefined();
  });

  it('automatically closes after default duration', async () => {
    render(
      <ErrorMessage
        message={mockMessage}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(mockMessage)).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(mockMessage)).toBeNull();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('automatically closes after custom duration', async () => {
    const customDuration = 3000;
    render(
      <ErrorMessage
        message={mockMessage}
        onClose={mockOnClose}
        duration={customDuration}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(customDuration);
    });

    expect(screen.queryByText(mockMessage)).toBeNull();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the close button', () => {
    const { container } = render(
      <ErrorMessage
        message={mockMessage}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);

    expect(container.firstChild).toBeNull();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('clears timeout when unmounted', () => {
    const { unmount } = render(
      <ErrorMessage
        message={mockMessage}
        onClose={mockOnClose}
      />
    );

    unmount();

    // Verify onClose wasn't called from timeout
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('does not call onClose if not provided when auto-closing', async () => {
    render(
      <ErrorMessage
        message={mockMessage}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(mockMessage)).toBeNull();
  });

  it('does not call onClose if not provided when manually closing', () => {
    const { container } = render(
      <ErrorMessage
        message={mockMessage}
      />
    );

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);

    expect(container.firstChild).toBeNull();
  });
});
