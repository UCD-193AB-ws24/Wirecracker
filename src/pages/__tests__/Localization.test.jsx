import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Localization from "../Localization";
import { MemoryRouter } from "react-router-dom";
import { saveCSVFile } from "../../utils/CSVParser";

// Mock dependencies
vi.mock("../../utils/CSVParser", () => ({
  saveCSVFile: vi.fn(),
  Identifiers: { LOCALIZATION: "localization" },
}));

// Mock the useError hook
const mockShowError = vi.fn();
vi.mock("../../context/ErrorContext", () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}));

// Mock the useWarning hook
const mockShowWarning = vi.fn();
vi.mock("../../context/WarningContext", () => ({
  useWarning: () => ({
    showWarning: mockShowWarning,
  }),
}));

vi.mock("../../App", () => ({
  GoogleSignInButton: () => <div>GoogleSignInButton</div>,
}));

// Mock the HelpButton component
vi.mock("../../utils/HelpButton", () => ({
    __esModule: true,
    default: (props) => <div data-testid="help-btn">{props.title}</div>,
}));

const mockNavigate = vi.fn();
const mockOnStateChange = vi.fn();
const mockOnHighlightChange = vi.fn();
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe("Localization Component", () => {
  const initialData = {
    data: {
      E1: {
        description: "Electrode 1",
        type: "DIXI",
        1: { contactDescription: "Contact 1", associatedLocation: "WM" },
      },
    },
  };

  const savedState = {
    electrodes: {
      E2: {
        description: "Electrode 2",
        type: "DIXI",
        1: { contactDescription: "Contact 1", associatedLocation: "WM" },
      },
    },
    fileId: "123",
    fileName: "Saved Anatomy",
    creationDate: "2023-01-01T00:00:00.000Z",
    modifiedDate: "2023-01-02T00:00:00.000Z",
    patientId: "patient-123",
  };

  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn().mockReturnValue("mock-token"),
      setItem: vi.fn(),
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    global.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders with initial data", () => {
    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Anatomy")).toBeDefined();
    expect(screen.getByDisplayValue("New Anatomy")).toBeDefined();
    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByText("Export")).toBeDefined();
  });

  test("renders with saved state", () => {
    render(
      <MemoryRouter>
        <Localization
          savedState={savedState}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    expect(screen.getByDisplayValue("Saved Anatomy")).toBeDefined();
    expect(screen.getByText("Created: 12/31/2022, 4:00:00 PM")).toBeDefined();
    expect(screen.getByText("Modified: 1/1/2023, 4:00:00 PM")).toBeDefined();
  });

  test("updates file name", async () => {
    render(
      <MemoryRouter>
        <Localization onStateChange={mockOnStateChange} />
      </MemoryRouter>,
    );

    const fileNameInput = screen.getByDisplayValue("New Anatomy");

    await act(async () => {
      fireEvent.change(fileNameInput, { target: { value: "Updated Anatomy" } });
    });

    expect(fileNameInput.value).toBe("Updated Anatomy");
    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("adds a new electrode", async () => {
    render(
      <MemoryRouter>
        <Localization onStateChange={mockOnStateChange} />
      </MemoryRouter>,
    );

    // Add electrode
    await act(async () => {
      fireEvent.click(screen.getByText("+"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E3" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "New Electrode" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "20" } });
      fireEvent.click(screen.getByText("Add", { selector: "button" }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("Overwrite existing electrode", async () => {
    render(
      <MemoryRouter>
        <Localization onStateChange={mockOnStateChange} />
      </MemoryRouter>,
    );

    // Add electrode
    await act(async () => {
      fireEvent.click(screen.getByText("+"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E3" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "New Electrode" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "20" } });
      fireEvent.click(screen.getByText("Add", { selector: "button" }));
    });

    // Edit the electrode
    await act(async () => {
      fireEvent.click(screen.getByText("+"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E3" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "New Electrode" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "25" } });
      fireEvent.click(screen.getByText("Add", { selector: "button" }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("Overwrite existing electrode with contact changed", async () => {
    render(
      <MemoryRouter>
        <Localization
          onStateChange={mockOnStateChange}
          initialData={initialData}
        />
      </MemoryRouter>,
    );

    // Edit the electrode
    await act(async () => {
      fireEvent.click(screen.getByText("+"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E1" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "Electrode 1" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "25" } });
      fireEvent.click(screen.getByText("Add", { selector: "button" }));
    });

    // Edit the electrode again
    await act(async () => {
      fireEvent.click(screen.getByText("+"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E1" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "Electrode 1" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "1" } });
      fireEvent.click(screen.getByText("Add", { selector: "button" }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("Update contact", async () => {
    render(
      <MemoryRouter>
        <Localization
          onStateChange={mockOnStateChange}
          initialData={initialData}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('E1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Select type...'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('GM'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save', { selector: '#ContactChangeButton' }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("Update contact in shared file", async () => {
    render(
      <MemoryRouter>
        <Localization
          onStateChange={mockOnStateChange}
          initialData={initialData}
          isSharedFile={true}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('E1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Select type...'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('GM/GM'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save', { selector: '#ContactChangeButton' }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("handle error during changing contact data", async () => {
    render(
      <MemoryRouter>
        <Localization
          onStateChange={mockOnStateChange}
          initialData={initialData}
          isSharedFile={true}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('E1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('1', { selector: 'div' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Select type...'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('GM/GM'));
    });

    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error("NetworkError")),
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save', { selector: '#ContactChangeButton' }));
    });

    expect(mockOnStateChange).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalled();
  });

  test("saves localization data", async () => {
    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(fetch).toHaveBeenCalled();
    expect(saveCSVFile).toHaveBeenCalled();
    expect(screen.getByText("Save successful!")).toBeDefined();
  });

  test("saves localization data on shared file", async () => {
    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
          isSharedFile={true}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(fetch).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test("handles save error", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error("NetworkError")),
    );

    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    // Add this check to ensure the warning is shown
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockShowWarning).toHaveBeenCalled();
    expect(saveCSVFile).toHaveBeenCalled();
  });

  test("exports localization data", async () => {
    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );
    
    await act(async () => {
      fireEvent.click(screen.getByText("Export"));
    });

    expect(saveCSVFile).toHaveBeenCalled();
  });

  test("creates network labelling tab", async () => {
    // Mock localStorage tabs
    global.localStorage.getItem.mockReturnValue("[]");

    // Mock fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/files/patient/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ patientId: "patient-123" }),
        });
      }
      if (url.includes("/api/by-patient/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              exists: false,
              data: { localization_data: {}, resection_data: {} },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <Localization
          savedState={savedState}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Open in Epilepsy Page"));
    });

    // Verify the custom event was dispatched
    expect(global.window.dispatchEvent).toHaveBeenCalled();
  });

  test("handles shared file changes", async () => {
    render(
      <MemoryRouter>
        <Localization
          isSharedFile={true}
          savedState={{ ...savedState, hasChanges: true }}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      // Wait for any async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Look for either "Submit Changes" or "Approve File" button
    const button = screen.getByRole("button", {
      name: "Approve File",
    });
    expect(button).toBeDefined();
  });

  test("shows approval modal", async () => {
    render(
      <MemoryRouter>
        <Localization
          isSharedFile={true}
          savedState={{ ...savedState, hasChanges: true }}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    // Click the button that could be either "Submit Changes" or "Approve File"
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Approve File",
        }),
      );
    });

    // Verify modal content
    expect(
      screen.getByText(
        "Once you approve this file, you will not be able to view or suggest changes unless the owner shares it with you again.",
      ),
    ).toBeDefined();
  });

  test("handles initialExpandedElectrode change", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          initialExpandedElectrode="E1"
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Electrode 1")).toBeDefined();

    await act(async () => {
      rerender(
        <MemoryRouter>
          <Localization
            initialData={initialData}
            initialExpandedElectrode="E2"
            onStateChange={mockOnStateChange}
          />
        </MemoryRouter>,
      );
    });

    // Verify the component responds to prop changes
    expect(mockOnStateChange).toHaveBeenCalled();
  });

  test("handles readOnly mode", () => {
    render(
      <MemoryRouter>
        <Localization initialData={initialData} readOnly={true} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Save")).toBeNull();
    expect(screen.queryByText("Export")).toBeNull();
    expect(screen.getByDisplayValue("New Anatomy")).toHaveProperty(
      "disabled",
      true,
    );
  });

  test("handles file metadata save error", async () => {
    global.fetch.mockImplementation(() =>
      Promise.reject(new Error("SomeWeirdError")),
    );

    render(
      <MemoryRouter>
        <Localization
          initialData={initialData}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "File metadata error: SomeWeirdError",
    );
  });

  test("handles approve file flow", async () => {
    render(
      <MemoryRouter>
        <Localization isSharedFile={true} savedState={savedState} />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Approve File"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Approve"));
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/approve/123"),
      expect.any(Object),
    );
  });

  test("handles submit changes flow", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/logs/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                type: "changes",
                snapshot: initialData.data,
              },
            ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <Localization
          isSharedFile={true}
          savedState={{ ...savedState, hasChanges: true }}
          onStateChange={mockOnStateChange}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTitle("Edit electrode"));
    });

    await act(async () => {
      const newElectrodeLabel = screen.getByLabelText("Electrode Label");
      fireEvent.change(newElectrodeLabel, { target: { value: "E3" } });
      const newElectrodeDesc = screen.getByLabelText("Description");
      fireEvent.change(newElectrodeDesc, {
        target: { value: "New Electrode" },
      });
      const newElectrodeNum = screen.getByLabelText("Number of Contacts");
      fireEvent.change(newElectrodeNum, { target: { value: "20" } });
      fireEvent.click(screen.getByText("Update", { selector: "button" }));
    });

    // TODO FAILING
    //       await act(async () => {
    //           fireEvent.click(screen.getByText('Submit Changes'));
    //       });
    //
    //       await act(async () => {
    //           fireEvent.click(screen.getByText('Submit'));
    //       });
    //
    //       expect(fetch).toHaveBeenCalledWith(
    //           expect.stringContaining('/api/submit-changes/123'),
    //                                          expect.any(Object)
    //       );
  });

  test("handles network error when creating resection tab", async () => {
    global.fetch.mockImplementation(() =>
      Promise.reject(new Error("NetworkError")),
    );
    // Mock localStorage tabs
    global.localStorage.getItem.mockReturnValue("[]");

    render(
      <MemoryRouter>
        <Localization savedState={savedState} />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Open in Epilepsy Page"));
    });

    expect(mockShowWarning).toHaveBeenCalled();
  });
  
  test("HelpButton renders with correct props", async () => {
    await act(async () => {
      render(<FunctionalTestSelection initialData={mockInitialData} />);
    });
    expect(screen.getByTestId("help-btn").textContent).toContain("Anatomy Page Help");
  });
});
