import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Designation from '../DesignationPage';
import { useError } from '../../../context/ErrorContext';
import { useWarning } from '../../../context/WarningContext';

// Mock the useError and useWarning hooks
vi.mock('../../../context/ErrorContext', () => ({
  useError: vi.fn()
}));

vi.mock('../../../context/WarningContext', () => ({
  useWarning: vi.fn()
}));

// Mock the CSVParser utility
vi.mock('../../../utils/CSVParser', () => ({
  saveDesignationCSVFile: vi.fn()
}));

// Mock the HelpButton component
vi.mock("../../utils/HelpButton", () => ({
    __esModule: true,
    default: (props) => <div data-testid="help-btn">{props.title}</div>,
}));

describe('DesignationPage', () => {
  const mockShowError = vi.fn();
  const mockShowWarning = vi.fn();
  const mockOnStateChange = vi.fn();
  const mockInitialData = {
    data: [
      {
        label: 'A',
        contacts: [
          {
            id: 'A1',
            index: 1,
            mark: 0,
            surgeonMark: false,
            associatedLocation: 'Location 1'
          },
          {
            id: 'A2',
            index: 2,
            mark: 1,
            surgeonMark: true,
            associatedLocation: 'Location 2'
          }
        ]
      }
    ],
    originalData: {
      patientId: '123',
      data: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useError.mockReturnValue({ showError: mockShowError });
    useWarning.mockReturnValue({ showWarning: mockShowWarning });
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<Designation initialData={mockInitialData} onStateChange={mockOnStateChange} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles contact click correctly', () => {
    render(<Designation initialData={mockInitialData} onStateChange={mockOnStateChange} />);
    const contact = screen.getByText('1');
    fireEvent.click(contact);
    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles save functionality', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const saveButton = screen.getByText('Save');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles export functionality', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const exportButton = screen.getByText('Export');
    await act(async () => {
      fireEvent.click(exportButton);
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles opening resection page', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    const addResectionTabEvent = new CustomEvent('addResectionTab', {
      detail: {
        data: {
          electrodes: mockInitialData.data,
          originalData: mockInitialData.originalData
        },
        patientId: mockState.patientId,
        state: {
          patientId: mockState.patientId,
          fileId: mockState.fileId,
          fileName: mockState.fileName,
          creationDate: mockState.creationDate,
          modifiedDate: new Date().toISOString()
        }
      }
    });

    // Mock fetch for checking existing resection data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ exists: false })
    });

    // Mock localStorage
    Storage.prototype.getItem = vi.fn().mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'tabs') return '[]';
      return null;
    });

    window.dispatchEvent = vi.fn();

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const resectionButton = screen.getByText('Open in Neurosurgery');
    
    await act(async () => {
      fireEvent.click(resectionButton);
    });

    // Wait for all promises to resolve
    await waitFor(() => {
      expect(window.dispatchEvent).toHaveBeenCalledWith(addResectionTabEvent);
    });
  });

  it('handles sharing with neurosurgeon', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    // Open share modal
    const shareButton = screen.getByText('Share with Neurosurgeon');
    fireEvent.click(shareButton);

    // Enter email
    const emailInput = screen.getByPlaceholderText('Enter email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Click share
    const shareSubmitButton = screen.getByText('Share');
    await act(async () => {
      fireEvent.click(shareSubmitButton);
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles keyboard filtering', async () => {
    render(<Designation initialData={mockInitialData} onStateChange={mockOnStateChange} />);
    
    // Press 'A' key
    fireEvent.keyDown(document, { key: 'a' });
    
    await waitFor(() => {
      expect(screen.getByText(/Filtering electrodes by: a \(Press a key to filter, Esc or Backspace to reset\)/)).toBeInTheDocument();
    });

    // Press Escape to clear filter
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.getByText(/Filtering electrodes by: None \(Press a key to filter, Esc or Backspace to reset\)/)).toBeInTheDocument();
    });
  });

  it('handles error cases', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    // Mock fetch to simulate network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const saveButton = screen.getByText('Save');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockShowError).toHaveBeenCalled();
  });

  it('handles state updates correctly', () => {
    const { rerender } = render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
      />
    );

    // Test state update with new props
    const newState = {
      patientId: '123',
      fileId: '789',
      creationDate: '2024-01-02',
      modifiedDate: '2024-01-02'
    };

    rerender(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={newState}
      />
    );

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("HelpButton renders with correct props", async () => {
    await act(async () => {
      render(<FunctionalTestSelection initialData={mockInitialData} />);
    });
    expect(screen.getByTestId("help-btn").textContent).toContain("Epileptic Network Labeling Page Help");
  });
});
