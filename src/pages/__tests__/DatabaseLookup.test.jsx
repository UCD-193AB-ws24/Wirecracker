// __tests__/DBLookup.test.js
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DBLookup from "../DatabaseLookup";
import * as d3 from "d3";
import React from "react";

const backendURL = __APP_CONFIG__.backendURL;

// Mock fetch
global.fetch = vi.fn();

// Mock D3 since we don't need to test actual D3 rendering
vi.mock("d3", () => {
  const mockSelection = {
    selectAll: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    join: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    node: vi.fn(),
    each: vi.fn().mockReturnThis(),
    html: vi.fn().mockReturnThis(),
    classed: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(), // Added data method
    enter: vi.fn().mockReturnThis(), // Added enter method
    exit: vi.fn().mockReturnThis(), // Added exit method
  };

  return {
    select: vi.fn().mockReturnValue(mockSelection),
    forceSimulation: vi.fn().mockReturnValue({
      force: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      alphaTarget: vi.fn().mockReturnThis(),
      restart: vi.fn(),
      stop: vi.fn(),
    }),
    drag: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
    }),
    zoom: vi.fn().mockReturnValue({
      scaleExtent: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    }),
    scaleOrdinal: vi.fn().mockReturnValue({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
    scaleLinear: vi.fn().mockReturnValue({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
    forceLink: vi.fn().mockReturnValue({
      id: vi.fn().mockReturnThis(),
      distance: vi.fn().mockReturnThis(),
      strength: vi.fn().mockReturnThis(),
    }),
    forceManyBody: vi.fn().mockReturnValue({
      strength: vi.fn().mockReturnThis(),
      distanceMin: vi.fn().mockReturnThis(),
      distanceMax: vi.fn().mockReturnThis(),
    }),
    forceCenter: vi.fn().mockReturnThis(),
    forceCollide: vi.fn().mockReturnValue({
      radius: vi.fn().mockReturnThis(),
      strength: vi.fn().mockReturnThis(),
    }),
    event: null,
  };
});

// Intercept fetch calls
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  fetch.mockImplementation((url) => {
    if (url.includes('/api/lobe-options')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ lobes: ['frontal', 'temporal', 'parietal', 'occipital'] })
      });
    }
    if (url.includes('/api/suggest')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: ['suggestion1', 'suggestion2'] })
      });
    }
    if (url.includes('/api/search')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cort: [],
          gm: [],
          functions: [],
          tests: []
        })
      });
    }

    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });

  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Tests for database lookup components
describe("DBLookup Component", () => {

  // Check if header, buttons, and search bar shows up in the first place or not
  test("Initial render", async () => {
    await act(async () => {
      render(<DBLookup />);
    });

    expect(screen.getByText('Database Lookup', { selector: 'h2' })).toBeDefined();
    expect(screen.getByPlaceholderText("Search database...", { selector: 'input' })).toBeDefined();
    expect(screen.getByText('Search', { selector: 'button' })).toBeDefined();
    expect(screen.getByText('Reset', { selector: 'button' })).toBeDefined();
    expect(screen.getByText('Show Filters', { selector: 'button' })).toBeDefined();
    expect(screen.getByText("No results to display. Perform a search to see results.")).toBeDefined();
  });

  // Check if search happens when Search button is pressed or not
  test("performs search when form is submitted", async () => {
    // Fake search result
    const mockResults = {
      cort: [],
      gm: [],
      functions: [],
      tests: [],
    };

    await act(async () => {
      render(<DBLookup />);
    });

    const searchInput = screen.getByPlaceholderText("Search database...");
    const searchButton = screen.getByText('Search', { selector: 'button' });

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "test query" } });
    });

    // Mock fetch here - after lobe query and suggestion fetch has fired
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    // Search button click
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Empty result => initial text to be displayed
    expect(screen.getByText("No results to display. Perform a search to see results.")).toBeDefined();

    // Make sure that fetch happened
    expect(fetch).toHaveBeenCalledWith(backendURL + "/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test query" }),
    });
  });

  // Test for network error
  test("displays error when search fails", async () => {
    await act(async () => {
      render(<DBLookup />);
    });

    // Mock some sort of error and reject
    fetch.mockRejectedValueOnce(new Error("Network error"));
    const searchButton = screen.getByText('Search', { selector: 'button' });
    await act(async () => {
      fireEvent.click(searchButton);
    });

    expect(screen.getByText("Network error")).toBeDefined();
  });

  // Check if show filter button work or not
  test("toggles filter visibility", async () => {
    await act(async () => {
      render(<DBLookup />);
    });

    const toggleButton = screen.getByText('Show Filters', { selector: 'button' });
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Once the filter is shown, all those items should be in the screen
    expect(
      screen.getByText("Hemisphere"),
      screen.getByText("Filters"),
      screen.getByText("Lobe")
    ).toBeDefined();

    // and show filter button should not be there
    expect(() => screen.getByText('Show Filters', { selector: 'button' })).toThrowError();

    // Also there should be button to hide them
    expect(screen.getByText('Hide Filters', { selector: 'button' })).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('Hide Filters', { selector: 'button' }));
    });
    // Once the hide filter button is clicked, show filter button should be there
    expect(
      screen.getByText('Show Filters', { selector: 'button' }),
    ).toBeDefined();

    // and hide filter button should not be there
    expect(() => screen.getByText('Hide Filters', { selector: 'button' })).toThrowError();
  });

  test("applies hemisphere filter", async () => {
    await act(async () => {
      render(<DBLookup />);
    });
    const searchButton = screen.getByText('Search', { selector: 'button' });

    // Show filters
    await act(async () => {
      fireEvent.click(screen.getByText('Show Filters', { selector: 'button' }));
    });

    // Select left hemisphere and search
    const leftCheckbox = screen.getByLabelText("Left");
    await act(async () => {
      fireEvent.click(leftCheckbox);
      // Advance timers for debounce
      vi.advanceTimersByTime(350);
      // First change does not search automatically
      fireEvent.click(searchButton);
    });

    // Check if the fetch has fired with appropriate body or not
    expect(fetch).toHaveBeenCalledWith(
      backendURL + "/api/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(
          {
            query: "",
            hemisphere: ["left"]
          }
        ),
      })
    );

    await act(async () => {
      // uncheck left hemisphere
      fireEvent.click(leftCheckbox);
      // Advance timers for debounce
      vi.runAllTimers();

      // onClick does not fire. Manually pressing the search button
      // github.com/testing-library/react-testing-library/issues/359
      fireEvent.click(searchButton);
    });

    expect(fetch).toHaveBeenCalledWith(
      backendURL + "/api/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(
          {
            query: ""
          }
        ),
      })
    );

    // Check right hemisphere
    const rightCheckbox = screen.getByLabelText("Right");

    await act(async () => {
      fireEvent.click(rightCheckbox);
      vi.runAllTimers();

      // onClick does not fire. Manually pressing the search button
      // github.com/testing-library/react-testing-library/issues/359
      fireEvent.click(searchButton);
    });

    expect(fetch).toHaveBeenCalledWith(
      backendURL + "/api/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(
          {
            query: "",
            hemisphere: ["right"]
          }
        ),
      })
    );
  });

  // Test for suggestion
  test("fetches and displays suggestions", async () => {
    await act(async () => {
      render(<DBLookup />);
    });

    // input something in the search bar to invoke suggestion mechanism
    const searchInput = screen.getByPlaceholderText("Search database...", { selector: 'input' });
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "test" } });
    });

    // Here, default mock value can be used, which is suggestion1 and suggestion2
    expect(fetch).toHaveBeenCalledWith(backendURL + "/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test" }),
    });

    // Suggestions appear
    expect(screen.getByText("suggestion1")).toBeDefined();
    expect(screen.getByText("suggestion2")).toBeDefined();

    // Click a suggestion
    await act(async () => {
      fireEvent.click(screen.getByText("suggestion1"));
    });
    // clicked suggestion should go into the search bar and other suggestion goes away
    expect(screen.getByDisplayValue("suggestion1", { selector: 'input' })).toBeDefined();
    expect(() => screen.getByText('suggestion2')).toThrowError();
  });

  test("transforms search results correctly", async () => {
    const mockResults = {
      cort: [
        {
          id: 1,
          name: "Cortical Area Alpha",
          hemisphere: "l",
          lobe: "frontal",
          electrode_label: "A1",
          acronym: "CA",
          cort_gm: {
            1: {
              gm: {
                id: 101,
                name: "Gray Matter Beta",
              },
            },
          },
        },
      ],
      gm: [
        {
          id: 101,
          name: "Gray Matter Beta",
          acronym: "GM",
          cort_gm: {
            1: {
              cort: {
                id: 1,
                name: "Cortical Area Alpha",
              },
            },
          },
        },
      ],
    };

    await act(async () => {
      render(<DBLookup />);
    });

    const searchInput = screen.getByPlaceholderText("Search database...", { selector: 'input' });
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "test" } });
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Search', { selector: 'button' }));
    });

    expect(screen.getByText("Results (2)")).toBeDefined();
    expect(screen.getByText("Cortical/Subcortical")).toBeDefined();
    expect(screen.getByText("Gray Matter")).toBeDefined();

  });

  test("toggles between table and graph view", async () => {
    const mockResults = {
      cort: [
        {
          id: 1,
          name: "Cortical Area",
          hemisphere: "l",
          lobe: "frontal",
          electrode_label: "A1",
          acronym: "CA",
          cort_gm: []
        },
      ],
    };



    await act(async () => {
      render(<DBLookup />);
    });

    // Perform search to get results
    const searchInput = screen.getByPlaceholderText("Search database...", { selector: 'input' });
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "test" } });
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Search', { selector: 'button' }));
    });

    expect(screen.getByText("Left Cortical Area")).toBeDefined();

    // Toggle to graph view
    const toggleButton = screen.getByText('Show Graph', { selector: 'button' });
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(screen.getByText('Show Table', { selector: 'button' })).toBeDefined();
    expect(d3.select).toHaveBeenCalled();
  });

  test("resets all inputs and results", async () => {
    const mockResults = {
      cort: [
        {
          id: 1,
          name: "Cortical Area",
          hemisphere: "l",
          lobe: "frontal",
          electrode_label: "A1",
          acronym: "CA",
          cort_gm: []
        },
      ],
    };

    await act(async () => {
      render(<DBLookup />);
    });

    // Perform search to have results on screen
    const searchInput = screen.getByPlaceholderText("Search database...", { selector: 'input' });
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "test" } });
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Search', { selector: 'button' }));
    });

    expect(screen.getByText("Left Cortical Area")).toBeDefined();

    // Click reset
    await act(async () => {
      fireEvent.click(screen.getByText('Reset', { selector: 'button' }));
    });

    expect(searchInput.value).toBe("");
    expect(screen.getByText("No results to display. Perform a search to see results.")).toBeDefined();
  });

  test("handles initial props correctly", async () => {
    const initialData = {
      query: "initial query",
      parameters: {
        hemisphere: ["left"],
        lobe: ["frontal"],
      },
    };

    await act(async () => {
      render(<DBLookup initialData={initialData} />);
    });

    expect(screen.getByPlaceholderText("Search database...", { selector: 'input' }).value).toBe("initial query");

    // Show filters to verify parameters
    await act(async () => {
      fireEvent.click(screen.getByText('Show Filters', { selector: 'button' }));
    });
    expect(screen.getByLabelText("Left").checked).toBe(true);
    expect(screen.getByLabelText("frontal").checked).toBe(true);
  });
});

describe("Graph Rendering", () => {
  beforeEach(() => {
    const mockResults = {
      cort: [
        {
          id: 1,
          name: "Cortical Area",
          hemisphere: "l",
          lobe: "frontal",
          cort_gm: {
            1: {
              gm: {
                id: 101,
                name: "Gray Matter",
              },
            },
          },
        },
      ],
      gm: [
        {
          id: 101,
          name: "Gray Matter",
          cort_gm: {
            1: {
              cort: {
                id: 1,
                name: "Cortical Area",
              },
            },
          },
        },
      ],
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });
  });

  test("renders graph with correct data", async () => {
    await act(async () => {
      render(<DBLookup />);
    });

    // Perform search
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Search database...", { selector: 'input' }), { target: { value: 'test' } });
      fireEvent.click(screen.getByText('Search', { selector: 'button' }));
    });

    expect(screen.getByText("Left Cortical Area")).toBeDefined();

    // Switch to graph view
    await act(async () => {
      fireEvent.click(screen.getByText('Show Graph', { selector: 'button' }));
    });

    // Verify D3 was called with expected data
    expect(d3.forceSimulation).toHaveBeenCalled();

    // The actual simulation data is complex to verify, but we can check some basics
    const simulationCall = d3.forceSimulation.mock.calls[0][0];
    expect(simulationCall.length).toBe(2); // Two nodes
    expect(simulationCall[0].name).toBe("Left Cortical Area");
    expect(simulationCall[1].name).toBe("Gray Matter");
  });

  test("cleans up graph when unmounting", async () => {
    let unmount;
    await act(async () => {
      const result = render(<DBLookup />);
      unmount = result.unmount;
    });

    // Perform search and switch to graph view
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Search database...", { selector: 'input' }), { target: { value: 'test' } });
      fireEvent.click(screen.getByText('Search', { selector: 'button' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show Graph', { selector: 'button' }));
    });

    await act(async () => {
      unmount();
    });

    expect(d3.select().selectAll().remove).toHaveBeenCalled();
  });
});
