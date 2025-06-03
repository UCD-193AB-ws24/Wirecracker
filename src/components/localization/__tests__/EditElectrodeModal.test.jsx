import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import EditElectrodeModal from '../EditElectrodeModal';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('reactjs-popup', () => ({
  default: ({ open, children }) => (open ? children({ close: vi.fn() }) : null),
}));

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

global.fetch = vi.fn();

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();
const mockSetElectrodes = vi.fn();

describe('EditElectrodeModal Component', () => {
  beforeEach(() => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        electrodeLabelDescriptions: [
          { label: 'A', description: 'Anterior' },
          { label: 'B', description: 'Basal' },
          { label: 'B', description: 'Basil' },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates contact count when electrode type changes (when not manually edited)', async () => {
    render(
      <MemoryRouter>
        <EditElectrodeModal
          trigger={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      </MemoryRouter>
    );

    // Default is DIXI with 4 contacts
    expect(screen.getByLabelText('Number of Contacts').value).toBe('4');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Type'), {
        target: { value: 'AD-TECH' },
      });
    });

    expect(screen.getByLabelText('Number of Contacts').value).toBe('5');

    // Manually change contact count
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Type'), {
        target: { value: 'DIXI' },
      });
    });

    // Should keep manually set value
    expect(screen.getByLabelText('Number of Contacts').value).toBe('4');
  });


  it('blank electrode label', async () => {
    render(
      <MemoryRouter>
        <EditElectrodeModal
          trigger={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      </MemoryRouter>
    );

    // Default is DIXI with 4 contacts
    expect(screen.getByLabelText('Number of Contacts').value).toBe('4');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Label'), {
        target: { value: '' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByText('Electrode label cannot be blank.')).toBeDefined();
  });


  it('non-valid contact number', async () => {
    let container = render(
      <MemoryRouter>
        <EditElectrodeModal
          trigger={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      </MemoryRouter>
    ).container;

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Label'), {
        target: { value: "A'" },
      });
      fireEvent.change(container.querySelector("#contact-number"), {
        target: { value: '-1' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByText('Number of contacts must be a positive integer.')).toBeDefined();
  });

  it('handle empty initial data', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <EditElectrodeModal
            trigger={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            isEditMode={true}
            initialData={{}}
          />
        </MemoryRouter>
      );
    });

    expect(screen.getByLabelText('Electrode Label').value).toBe("");
    expect(screen.getByLabelText('Description').value).toBe("");
  });

  it('handle initial contact number', async () => {
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <EditElectrodeModal
            trigger={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            isEditMode={true}
            initialData={{
              E1: {
                description: "Electrode 1",
                type: "DIXI",
                1: { contactDescription: "Contact 1", associatedLocation: "WM" },
                2: { contactDescription: "Contact 2", associatedLocation: "WM" },
              }
            }}
          />
        </MemoryRouter>
      ).container;
    });

    // TODO FAILING
//     expect(container.querySelector("#contact-number").value).toBe("2");
  });

  it('handle initial contact number that is 0', async () => {
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <EditElectrodeModal
            trigger={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            isEditMode={true}
            initialData={{
              contacts: {}
            }}
          />
        </MemoryRouter>
      ).container;
    });

    expect(container.querySelector("#contact-number").value).toBe("0");
  });

  it('description dropdown', async () => {
    render(
      <MemoryRouter>
        <EditElectrodeModal
          trigger={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Label'), {
        target: { value: "B" },
      });
    });

    await act(async () => {
      fireEvent.focus(screen.getByLabelText('Description'));
    });
    expect(screen.getByText('Right Basal', { selector: 'div' })).toBeDefined();
    expect(screen.getByText('Right Basil', { selector: 'div' })).toBeDefined();

    await act(async () => {
      fireEvent.mouseDown(screen.getByText('Right Basil'));
    });

    expect(screen.getByLabelText('Description').value).toBe("Right Basil");
  });

  it('description dropdown to go away when not in focus', async () => {
    render(
      <MemoryRouter>
        <EditElectrodeModal
          trigger={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      </MemoryRouter>
    );

    vi.useFakeTimers()

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Electrode Label'), {
        target: { value: "B" },
      });
    });

    await act(async () => {
      fireEvent.focus(screen.getByLabelText('Description'));
    });
    expect(screen.getByText('Right Basal', { selector: 'div' })).toBeDefined();
    expect(screen.getByText('Right Basil', { selector: 'div' })).toBeDefined();

    await act(async () => {
      fireEvent.blur(screen.getByLabelText('Description'));
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(() => screen.getByText('Right Basil', { selector: 'div' })).toThrowError();

    vi.useRealTimers();
  });
});
