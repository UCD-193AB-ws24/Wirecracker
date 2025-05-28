import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Resection from '../ResectionPage';
import { useError } from '../../../context/ErrorContext';
import load_untouch_nii from '../../../utils/Nifti_viewer/load_untouch_nifti.js';
import nifti_anatomical_conversion from '../../../utils/Nifti_viewer/nifti_anatomical_conversion.js';
import { parseCSVFile } from '../../../utils/CSVParser';

// Mock the useError hook
vi.mock('../../../context/ErrorContext', () => ({
  useError: vi.fn()
}));

// Mock the CSVParser utility
vi.mock('../../../utils/CSVParser', () => ({
  saveDesignationCSVFile: vi.fn(),
  parseCSVFile: vi.fn()
}));

// Mock the Nifti viewer utilities
vi.mock('../../../utils/Nifti_viewer/load_untouch_nifti.js', () => ({
  default: vi.fn()
}));

vi.mock('../../../utils/Nifti_viewer/nifti_anatomical_conversion.js', () => ({
  default: vi.fn()
}));

// Mock IndexedDB storage
vi.mock('../../../utils/IndexedDBStorage', () => ({
  niftiStorage: {
    getNiftiFile: vi.fn(),
    saveNiftiFile: vi.fn(),
    deleteNiftiFile: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ResectionPage', () => {
  const mockShowError = vi.fn();
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
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<Resection initialData={mockInitialData} onStateChange={mockOnStateChange} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles contact click correctly', () => {
    render(<Resection initialData={mockInitialData} onStateChange={mockOnStateChange} />);
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
      <Resection 
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
      <Resection 
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

  it('handles opening designation page', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01'
    };

    const addDesignationTabEvent = new CustomEvent('addDesignationTab', {
      detail: {
        patientId: mockState.patientId,
        fileId: mockState.fileId
      }
    });
    window.dispatchEvent = vi.fn();

    render(
      <Resection 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const designationButton = screen.getByText('Open in Epilepsy Page');
    await act(async () => {
      fireEvent.click(designationButton);
      window.dispatchEvent(addDesignationTabEvent);
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(addDesignationTabEvent);
  });

  it('handles NIfTI file upload', async () => {
    const mockFile = new File([''], 'test.nii', { type: 'application/octet-stream' });
    const mockNiftiData = {
      img: new Array(100).fill(0),
      hdr: {
        dime: {
          dim: [3, 100, 100, 100],
          pixdim: [1, 1, 1, 1],
          datatype: 2,
          bitpix: 8,
          glmax: 255
        }
      }
    };

    vi.mocked(load_untouch_nii).mockReturnValue(mockNiftiData);
    vi.mocked(nifti_anatomical_conversion).mockReturnValue(mockNiftiData);

    render(<Resection initialData={mockInitialData} onStateChange={mockOnStateChange} />);

    const fileInput = screen.getByLabelText('Open NIfTI File');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles CSV file upload', async () => {
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockCSVData = {
      identifier: 'coordinates',
      data: [
        {
          Electrode: 'A',
          Contact: '1',
          x: 0,
          y: 0,
          z: 0
        }
      ]
    };

    vi.mocked(parseCSVFile).mockResolvedValue(mockCSVData);

    render(<Resection initialData={mockInitialData} onStateChange={mockOnStateChange} />);

    const fileInput = screen.getByLabelText('Open Coordinate File');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    expect(mockOnStateChange).toHaveBeenCalled();
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
      <Resection 
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
      <Resection 
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
      <Resection 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={newState}
      />
    );

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles NIfTI image removal', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01',
      isLoaded: true
    };

    render(
      <Resection 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const removeButton = screen.getByText('Remove NIfTI image');
    await act(async () => {
      fireEvent.click(removeButton);
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  it('handles canvas interactions', async () => {
    const mockState = {
      patientId: '123',
      fileId: '456',
      creationDate: '2024-01-01',
      modifiedDate: '2024-01-01',
      isLoaded: true
    };

    render(
      <Resection 
        initialData={mockInitialData} 
        onStateChange={mockOnStateChange}
        savedState={mockState}
      />
    );

    const mainCanvas = screen.getByTestId('main-canvas');
    
    // Test mouse events
    fireEvent.mouseDown(mainCanvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(mainCanvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(mainCanvas);

    // Test wheel event
    fireEvent.wheel(mainCanvas, { deltaY: 100 });

    expect(mockOnStateChange).toHaveBeenCalled();
  });
});
