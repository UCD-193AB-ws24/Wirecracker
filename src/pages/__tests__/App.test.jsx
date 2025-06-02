import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import * as ReactRouterDom from "react-router-dom";
import "fake-indexeddb/auto.js";
import App from "../../App";

// Mock all child components
vi.mock("./pages/Localization", () => ({
    __esModule: true,
    default: (props) => <div data-testid="Localization">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/ContactDesignation/DesignationPage", () => ({
    __esModule: true,
    default: (props) => <div data-testid="Designation">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/ContactDesignation/ResectionPage", () => ({
    __esModule: true,
    default: (props) => <div data-testid="Resection">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/StimulationPlanning/PlanTypeSelection", () => ({
    __esModule: true,
    default: (props) => <div data-testid="PlanTypePage">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/StimulationPlanning/ContactSelection", () => ({
    __esModule: true,
    default: (props) => <div data-testid="ContactSelection">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/StimulationPlanning/FunctionalTestSelection", () => ({
    __esModule: true,
    default: (props) => <div data-testid="FunctionalTestSelection">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/UserDocumentation", () => ({
    __esModule: true,
    default: (props) => <div data-testid="UserDocumentation">{JSON.stringify(props)}</div>,
}));
vi.mock("./pages/DatabaseLookup", () => ({
    __esModule: true,
    default: (props) => <div data-testid="DBLookup">{JSON.stringify(props)}</div>,
}));
vi.mock("./utils/Dropdown", () => ({
    __esModule: true,
    default: () => <div data-testid="Dropdown" />,
}));
vi.mock("./pages/Signup", () => ({
    __esModule: true,
    default: () => <div data-testid="Signup" />,
}));
vi.mock("./pages/Login", () => ({
    __esModule: true,
    default: () => <div data-testid="Login" />,
}));
vi.mock("./pages/Debug", () => ({
    __esModule: true,
    default: () => <div data-testid="Debug" />,
}));
vi.mock("./pages/DatabaseTable", () => ({
    __esModule: true,
    default: () => <div data-testid="DatabaseTable" />,
}));
vi.mock("./pages/GoogleAuthSuccess", () => ({
    __esModule: true,
    default: () => <div data-testid="GoogleAuthSuccess" />,
}));

// Patch useNavigate to avoid errors
vi.spyOn(ReactRouterDom, "useNavigate").mockImplementation(() => vi.fn());


function renderWithTab(tab) {
    // Patch localStorage for token
    vi.stubGlobal("localStorage", {
        getItem: (key) => {
            if (key === "token") return "token";
            if (key === "tabs") return JSON.stringify([tab]);
            if (key === "activeTab") return tab.id;
            return null;
        },
        setItem: vi.fn(),
        removeItem: vi.fn(),
    });
    return render(<App />);
}

describe("renderTabContent in HomePage", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders home tab", () => {
        renderWithTab({ id: "home", title: "Home", content: "home" });
        expect(screen.getByText("Wirecracker")).toBeDefined();
        expect(screen.getByText("My Files")).toBeDefined();
        expect(screen.getByText("Recent Patients")).toBeDefined();
    });

    it("renders localization tab", () => {
        renderWithTab({ id: "1", title: "Anatomy", content: "localization", state: {} });
        expect(screen.getByTestId("Localization")).toBeDefined();
    });

    it("renders csv-localization tab", () => {
        renderWithTab({ id: "2", title: "Anatomy", content: "csv-localization", state: {}, data: {} });
        expect(screen.getByTestId("Localization")).toBeDefined();
    });

    it("renders designation tab", () => {
        renderWithTab({ id: "3", title: "Epilepsy", content: "designation", state: {}, data: {} });
        expect(screen.getByTestId("Designation")).toBeDefined();
    });

    it("renders csv-designation tab", () => {
        renderWithTab({ id: "4", title: "Epilepsy", content: "csv-designation", state: {}, data: { data: {} } });
        expect(screen.getByTestId("Designation")).toBeDefined();
    });

    it("renders resection tab", () => {
        renderWithTab({ id: "5", title: "Neurosurgery", content: "resection", state: {}, data: {} });
        expect(screen.getByTestId("Resection")).toBeDefined();
    });

    it("renders csv-resection tab", () => {
        renderWithTab({ id: "6", title: "Neurosurgery", content: "csv-resection", state: {}, data: { data: {} } });
        expect(screen.getByTestId("Resection")).toBeDefined();
    });

    it("renders stimulation tab", () => {
        renderWithTab({ id: "7", title: "Plan Type Selection", content: "stimulation", state: {}, data: {} });
        expect(screen.getByTestId("PlanTypePage")).toBeDefined();
    });

    it("renders seizure-recreation tab", () => {
        renderWithTab({ id: "8", title: "Seizure Recreation", content: "seizure-recreation", state: {}, data: {} });
        expect(screen.getByTestId("ContactSelection")).toBeDefined();
    });

    it("renders cceps tab", () => {
        renderWithTab({ id: "9", title: "CCEPs", content: "cceps", state: {}, data: {} });
        expect(screen.getByTestId("ContactSelection")).toBeDefined();
    });

    it("renders functional-mapping tab", () => {
        renderWithTab({ id: "10", title: "Functional Mapping", content: "functional-mapping", state: {}, data: {} });
        expect(screen.getByTestId("ContactSelection")).toBeDefined();
    });

    it("renders csv-stimulation tab", () => {
        renderWithTab({ id: "11", title: "Stimulation", content: "csv-stimulation", state: {}, data: { type: "recreation" } });
        expect(screen.getByTestId("ContactSelection")).toBeDefined();
    });

    it("renders csv-functional-mapping tab", () => {
        renderWithTab({ id: "12", title: "Functional Mapping", content: "csv-functional-mapping", state: {}, data: {} });
        expect(screen.getByTestId("ContactSelection")).toBeDefined();
    });

    it("renders functional-test tab", () => {
        renderWithTab({ id: "13", title: "Neuropsychology", content: "functional-test", state: {}, data: {} });
        expect(screen.getByTestId("FunctionalTestSelection")).toBeDefined();
    });

    it("renders csv-functional-test tab", () => {
        renderWithTab({ id: "14", title: "Neuropsychology", content: "csv-functional-test", state: {}, data: {} });
        expect(screen.getByTestId("FunctionalTestSelection")).toBeDefined();
    });

    it("renders usage-docs tab", () => {
        renderWithTab({ id: "15", title: "Docs", content: "usage-docs", state: {}, data: {} });
        expect(screen.getByTestId("UserDocumentation")).toBeDefined();
    });

    it("renders database-lookup tab", () => {
        renderWithTab({ id: "16", title: "Lookup", content: "database-lookup", state: {}, data: {} });
        expect(screen.getByTestId("DBLookup")).toBeDefined();
    });

    it("renders nothing for unknown tab type", () => {
        renderWithTab({ id: "17", title: "Unknown", content: "unknown", state: {}, data: {} });
        // Should not find any testid from above
        expect(screen.queryByTestId("Localization")).toBeNull();
        expect(screen.queryByTestId("Designation")).toBeNull();
        expect(screen.queryByTestId("Resection")).toBeNull();
        expect(screen.queryByTestId("PlanTypePage")).toBeNull();
        expect(screen.queryByTestId("ContactSelection")).toBeNull();
        expect(screen.queryByTestId("FunctionalTestSelection")).toBeNull();
        expect(screen.queryByTestId("UserDocumentation")).toBeNull();
        expect(screen.queryByTestId("DBLookup")).toBeNull();
    });
});