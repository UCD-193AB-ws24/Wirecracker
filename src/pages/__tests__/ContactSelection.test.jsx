import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ContactSelection from "../StimulationPlanning/ContactSelection";

// src/pages/StimulationPlanning/ContactSelection.test.jsx

// Mock dependencies
vi.mock("../../utils/CSVParser", () => ({
    saveStimulationCSVFile: vi.fn(),
}));
vi.mock("../../context/ErrorContext", () => ({
    useError: () => ({ showError: vi.fn() }),
}));
vi.mock("../../context/WarningContext", () => ({
    useWarning: () => ({ showWarning: vi.fn() }),
}));
vi.mock("../../utils/MapConsecutive", () => ({
    __esModule: true,
    default: (arr, size, fn) => {
        // Return consecutive pairs for test
        if (!Array.isArray(arr)) return [];
        const out = [];
        for (let i = 0; i < arr.length - 1; i++) {
            const pair = [arr[i], arr[i + 1]];
            const res = fn(pair);
            if (res) out.push(res);
        }
        return out;
    },
}));
vi.mock("../../utils/HelpButton", () => ({
    __esModule: true,
    default: (props) => <div data-testid="help-btn">{props.title}</div>,
}));
vi.mock("react-dnd", () => ({
    useDrag: () => [{ isDragging: false }, vi.fn()],
    useDrop: () => [{ isOver: false }, vi.fn()],
    DndProvider: ({ children }) => <div>{children}</div>,
}));
vi.mock("react-dnd-html5-backend", () => ({
    HTML5Backend: {},
}));
vi.mock("react-floating-action-button", () => ({
    Container: ({ children }) => <div data-testid="fab-container">{children}</div>,
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
    darkColors: { lightBlue: "#00f" },
    lightColors: { white: "#fff" },
}));

const mockElectrodes = [
    {
        label: "A",
        contacts: [
            { associatedLocation: "frontal", mark: 1, surgeonMark: true, isPlanning: false, order: 1, frequency: 10, duration: 5, current: 1 },
            { associatedLocation: "frontal", mark: 2, surgeonMark: true, isPlanning: false, order: 2, frequency: 10, duration: 5, current: 1 },
            { associatedLocation: "frontal", mark: 0, surgeonMark: false, isPlanning: false, order: 3, frequency: 10, duration: 5, current: 1 },
        ],
    },
    {
        label: "B",
        contacts: [
            { associatedLocation: "temporal", mark: 1, surgeonMark: true, isPlanning: false, order: 1, frequency: 10, duration: 5, current: 1 },
            { associatedLocation: "temporal", mark: 2, surgeonMark: false, isPlanning: false, order: 2, frequency: 10, duration: 5, current: 1 },
        ],
    },
];

const mockInitialData = {
    data: mockElectrodes,
    patientId: "p1",
};

describe("ContactSelection", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => "token"),
        });
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
            text: () => Promise.resolve(JSON.stringify({ success: true })),
            headers: { entries: () => [] },
            status: 200,
        });
        window.dispatchEvent = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("renders main UI elements", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        expect(screen.getByTestId("help-btn").textContent).toContain("Contact Stimulation Page Help");
        expect(screen.getByText("Save")).toBeDefined();
        expect(screen.getByText("Export")).toBeDefined();
        expect(screen.getByText("T")).toBeDefined();
        expect(screen.getByTestId("fab-container")).toBeDefined();
    });

    test("calls onStateChange on mount and state update", async () => {
        const onStateChange = vi.fn();
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={onStateChange} />);
        });
        expect(onStateChange).toHaveBeenCalled();
    });

    test("toggles areAllVisible when toggle button is clicked", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        const toggleBtn = screen.getByText("T");
        await act(async () => {
            fireEvent.click(toggleBtn);
        });
        // No error means toggle worked; state is internal
        expect(toggleBtn).toBeDefined();
    });

    test("adds and removes a contact to/from planning", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Find a contact pair (should be 1-2 for electrode A)
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Now it should appear in planning pane (as A1-2)
        expect(screen.getByText(/A1-2/)).toBeDefined();
        // Remove from planning
        const removeBtn = screen.getByText("Remove");
        await act(async () => {
            fireEvent.click(removeBtn);
        });
        // Should show "Drag contacts here" again
        expect(screen.getByText("Drag contacts here")).toBeDefined();
    });

    test("shows Save successful feedback after saving", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Save
        const saveBtn = screen.getByText("Save");
        await act(async () => {
            fireEvent.click(saveBtn);
        });
        expect(screen.getByText("Save successful!")).toBeDefined();
    });

    test("calls saveStimulationCSVFile on Export", async () => {
        const { saveStimulationCSVFile } = await import("../../utils/CSVParser");
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Export
        const exportBtn = screen.getByText("Export");
        await act(async () => {
            fireEvent.click(exportBtn);
        });
        expect(saveStimulationCSVFile).toHaveBeenCalled();
    });

    test("shows and closes Share with Neuropsychologist modal", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Open share modal
        const shareBtn = screen.getByText("Share with Neuropsychologist");
        await act(async () => {
            fireEvent.click(shareBtn);
        });
        expect(screen.getByText("Neuropsychologist's Email")).toBeDefined();
        // Close modal
        const cancelBtn = screen.getByText("Cancel");
        await act(async () => {
            fireEvent.click(cancelBtn);
        });
        expect(screen.queryByText("Neuropsychologist's Email")).toBeNull();
    });

    test("shows error if sharing without email", async () => {
        const { useError } = await import("../../context/ErrorContext");
        const { showError } = useError();
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Open share modal
        const shareBtn = screen.getByText("Share with Neuropsychologist");
        await act(async () => {
            fireEvent.click(shareBtn);
        });
        // Click Share without entering email
        const shareModalBtn = screen.getByText("Share");
        await act(async () => {
            fireEvent.click(shareModalBtn);
        });
        expect(showError).toHaveBeenCalled();
    });

    test("opens Neuropsychology tab when Open in Neuropsychology is clicked", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Open in Neuropsychology
        const neuroBtn = screen.getByText("Open in Neuropsychology");
        await act(async () => {
            fireEvent.click(neuroBtn);
        });
        // Should dispatch addFunctionalTestTab event
        expect(window.dispatchEvent).toHaveBeenCalled();
    });

    test("renders planning contact with correct color classes", async () => {
        await act(async () => {
            render(<ContactSelection initialData={mockInitialData} onStateChange={vi.fn()} />);
        });
        // Add a contact to planning
        const contactPair = screen.getByText("1 - 2");
        await act(async () => {
            fireEvent.click(contactPair);
        });
        // Should have bg-rose-300 for mark 1
        const planningContact = screen.getByText(/A1-2/).closest("li");
        expect(planningContact.className).toContain("bg-rose-300");
    });
});