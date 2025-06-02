import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Electrode from '../Electrode';
import { MemoryRouter } from 'react-router-dom';

global.fetch = vi.fn();

// Mock the useError hook
const mockShowError = vi.fn();
vi.mock("../../../context/ErrorContext", () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}));

// Mock the useError hook
const mockShowWarning = vi.fn();
vi.mock("../../../context/WarningContext", () => ({
  useWarning: () => ({
    showWarning: mockShowWarning,
  }),
}));

const mockSetElectrodes = vi.fn();
const mockSetExpandedElectrodes = vi.fn();

describe('Electrode Component', () => {
  beforeEach(() => {
      global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // TODO add assertion
  it('highlighted change', async () => {
    render(
      <MemoryRouter>
        <Electrode
            name={"A"}
            highlightedChange={{
                label: "A",
                key: null
            }}
            electrodes={{
              A: {
                description: "Electrode 1",
                type: "DIXI",
                1: { contactDescription: "Contact 1", associatedLocation: "WM" },
                2: { contactDescription: "Contact 2", associatedLocation: "WM" },
              }
            }}
        />
      </MemoryRouter>
    );
  });

  it('collapse electrode', async () => {
    render(
      <MemoryRouter>
        <Electrode
            name={"A"}
            electrodes={{
              A: {
                description: "Electrode 1",
                type: "DIXI",
                1: { contactDescription: "Contact 1", associatedLocation: "WM" },
                2: { contactDescription: "Contact 2", associatedLocation: "WM" },
              }
            }}
            expandedElectrode={"A"}
            setExpandedElectrode={mockSetExpandedElectrodes}
        />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("A"));
    });

    expect(mockSetExpandedElectrodes).toHaveBeenCalledWith("");
  });

  it('delete electrode', async () => {
    render(
      <MemoryRouter>
        <Electrode
            name={"A"}
            electrodes={{
              A: {
                description: "Electrode 1",
                type: "DIXI",
                1: { contactDescription: "Contact 1", associatedLocation: "WM" },
                2: { contactDescription: "Contact 2", associatedLocation: "WM" },
              }
            }}
            setModifiedDate={() => {}}
            expandedElectrode={"A"}
            setExpandedElectrode={mockSetExpandedElectrodes}
            setElectrodes={mockSetElectrodes}
        />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByTitle("Delete electrode"));
    });

    expect(screen.getByText('Are you sure you want to delete this electrode? This action cannot be undone.')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(mockSetElectrodes).toHaveBeenCalled();
    expect(mockSetExpandedElectrodes).toHaveBeenCalled();
  });
});
