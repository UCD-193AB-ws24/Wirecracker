import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Designation from '../DesignationPage';
import { useError } from '../../../context/ErrorContext';

// Mock the useError hook
vi.mock('../../../context/ErrorContext', () => ({
  useError: vi.fn()
}));

// Mock the CSVParser utility
vi.mock('../../../utils/CSVParser', () => ({
  saveDesignationCSVFile: vi.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {
    "Designation_Resection_Sync_Channel": JSON.stringify({})
  };
  return {
    getItem: vi.fn(key => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {
        "Designation_Resection_Sync_Channel": JSON.stringify({})
      };
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('DesignationPage', () => {
  const mockShowError = vi.fn();
  const mockOnStateChange = vi.fn();
  const mockInitialData = {
    data: {
      electrodes: [
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
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useError.mockReturnValue({ showError: mockShowError });
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

  it('handles opening stimulation page', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    const addStimulationTabEvent = new CustomEvent('addStimulationTab');
    window.dispatchEvent = vi.fn();

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const stimulationButton = screen.getByText('Open in Stimulation Page');
    await act(async () => {
      fireEvent.click(stimulationButton);
    });

    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('handles opening test selection page', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    const addFunctionalTestTabEvent = new CustomEvent('addFunctionalTestTab');
    window.dispatchEvent = vi.fn();

    render(
      <Designation 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const testSelectionButton = screen.getByText('Open in Neuropsychology');
    await act(async () => {
      fireEvent.click(testSelectionButton);
    });

    expect(window.dispatchEvent).toHaveBeenCalled();
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
});
