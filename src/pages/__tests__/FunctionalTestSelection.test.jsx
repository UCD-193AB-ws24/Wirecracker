import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FunctionalTestSelection from "../StimulationPlanning/FunctionalTestSelection";
import React from "react";

const backendURL = __APP_CONFIG__.backendURL;

// Mock dependencies
vi.mock("../../utils/CSVParser", () => ({
    saveTestCSVFile: vi.fn(),
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
        // Simple consecutive pairs for test
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

const mockTests = [
    {
        id: "t1",
        name: "Test 1",
        region: ["frontal"],
        description: "desc1",
        population: 100,
        disruptionRate: 10,
        tag: ["tag1"],
    },
    {
        id: "t2",
        name: "Test 2",
        region: ["temporal"],
        description: "desc2",
        population: 80,
        disruptionRate: 20,
        tag: ["tag2"],
    },
];

const mockContacts = [
    {
        id: "c1",
        associatedLocation: "frontal",
        mark: 1,
        surgeonMark: true,
        isPlanning: true,
        order: 1,
        duration: 10,
        frequency: 50,
        current: 2,
    },
    {
        id: "c2",
        associatedLocation: "temporal",
        mark: 2,
        surgeonMark: false,
        isPlanning: true,
        order: 2,
        duration: 10,
        frequency: 50,
        current: 2,
    },
];

const mockInitialData = {
    data: {
        data: [
            { contacts: mockContacts },
        ],
    },
    tests: {},
};

function mockFetch(data = mockTests) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data }),
    });
}

describe("FunctionalTestSelection", () => {
    beforeEach(() => {
        mockFetch();
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => "token"),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("renders main headings and buttons", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        expect(screen.getByText("Neuropsychology")).toBeDefined();
        expect(screen.getByText("Auto-Assign Best Tests")).toBeDefined();
        expect(screen.getByText("+ Add Test")).toBeDefined();
        expect(screen.getByTestId("help-btn")).toBeDefined();
        expect(screen.getByText("Save")).toBeDefined();
        expect(screen.getByText("Export")).toBeDefined();
    });

    test("auto-assigns best tests", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        const btn = screen.getByText("Auto-Assign Best Tests");
        await act(async () => {
            fireEvent.click(btn);
        });
        // After auto-assign, test name should appear
        expect(screen.getByText("Test 1")).toBeDefined();
    });

    test("shows add test popup and adds a test", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        fireEvent.click(screen.getByText("+ Add Test"));
        expect(screen.getByText(/Select a Test for/)).toBeDefined();
        // Select a test
        await act(async () => {
            fireEvent.click(screen.getByText("Test 1"));
        });
        // Confirm button should be enabled
        const confirmBtn = screen.getByText("Confirm");
        await act(async () => {
            fireEvent.click(confirmBtn);
        });
        // Test should now be listed
        expect(screen.getByText("Test 1")).toBeDefined();
    });

    test("removes a test", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        fireEvent.click(screen.getByText("+ Add Test"));
        await act(async () => {
            fireEvent.click(screen.getByText("Test 1"));
        });
        await act(async () => {
            fireEvent.click(screen.getByText("Confirm"));
        });
        // Remove button (×) should be present
        const removeBtn = screen.getByText("×");
        await act(async () => {
            fireEvent.click(removeBtn);
        });
        // Test should be removed
        expect(screen.queryByText("Test 1")).toBeNull();
    });

    test("toggles test details", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        fireEvent.click(screen.getByText("+ Add Test"));
        await act(async () => {
            fireEvent.click(screen.getByText("Test 1"));
        });
        await act(async () => {
            fireEvent.click(screen.getByText("Confirm"));
        });
        // Click test to expand details
        await act(async () => {
            fireEvent.click(screen.getByText("Test 1"));
        });
        expect(screen.getByText("desc1")).toBeDefined();
        // Collapse
        await act(async () => {
            fireEvent.click(screen.getByText("Test 1"));
        });
        expect(screen.queryByText("desc1")).toBeNull();
    });

    test("calls exportTests and saveTestCSVFile on Export", async () => {
        const { saveTestCSVFile } = await import("../../utils/CSVParser");
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        await act(async () => {
            fireEvent.click(screen.getByText("Export"));
        });
        expect(saveTestCSVFile).toHaveBeenCalled();
    });

    test("calls exportTests and shows save success on Save", async () => {
        const { saveTestCSVFile } = await import("../../utils/CSVParser");
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} savedState={{ fileId: "f1" }} />);
        });
        await act(async () => {
            fireEvent.click(screen.getByText("Save"));
        });
        expect(saveTestCSVFile).toHaveBeenCalled();
        // Show success feedback
        expect(screen.getByText("Save successful!")).toBeDefined();
    });

    test("calls onStateChange when state updates", async () => {
        const onStateChange = vi.fn();
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} onStateChange={onStateChange} />);
        });
        expect(onStateChange).toHaveBeenCalled();
    });

    test("getMarkColor returns correct classes", async () => {
        const { default: Comp } = await import("../StimulationPlanning/FunctionalTestSelection");
        // getMarkColor is not exported, so test via rendering
        await act(async () => {
            render(<Comp initialData={mockInitialData} />);
        });
        // Should render with bg-rose-300 for mark 1, bg-amber-300 for mark 2
        const pair = screen.getByText("c1-c2").closest(".shadow-sm");
        expect(pair.className).toContain("bg-rose-300");
    });

    test("HelpButton renders with correct props", async () => {
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        expect(screen.getByTestId("help-btn").textContent).toContain("Functional Test Assignment Page Help");
    });

    test("shows warning if no token on save", async () => {
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => null),
        });
        const { useError } = await import("../../context/ErrorContext");
        const { showError } = useError();
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} savedState={{ fileId: "f1" }} />);
        });
        await act(async () => {
            fireEvent.click(screen.getByText("Save"));
        });
        expect(showError).toHaveBeenCalled();
    });

    test("shows 'No tests available' in popup if none", async () => {
        mockFetch([]);
        await act(async () => {
            render(<FunctionalTestSelection initialData={mockInitialData} />);
        });
        fireEvent.click(screen.getByText("+ Add Test"));
        expect(screen.getByText("No tests available.")).toBeDefined();
    });
});