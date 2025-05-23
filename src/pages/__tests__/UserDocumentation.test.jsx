import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import UserDocumentation from "../UserDocumentation";
import ReactMarkdown from 'react-markdown';
import { useParams } from "react-router-dom";

// Mock dependencies
vi.mock("react-markdown");
vi.mock("react-router-dom", () => ({
    useParams: vi.fn(),
}));

describe("UserDocumentation", () => {
    const mockMarkdownContent = "This is test content.";

    beforeEach(() => {
        global.fetch = vi.fn();
        ReactMarkdown.mockImplementation(({ children }) => (
            <p>{children}</p>
        ));
        useParams.mockReturnValue({ path: "test-path" });
        fetch.mockImplementation((url) => {
            if (url.includes('/api/usage-docs/test-path')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(mockMarkdownContent)
                });
            }
            return Promise.reject(new Error(`Unknown URL: ${url}`));
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("renders loading state initially", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            text: () => new Promise(()=>{}), // Promise that never resolve
        });
        await act(async () => {
            render(<UserDocumentation />);
        });
        expect(screen.getByTestId("loading-spinner")).toBeDefined();
    });

    test("fetches documentation when mounted", async () => {
        await act(async () => {
            render(<UserDocumentation />);
        });

        expect(fetch).toHaveBeenCalledWith(
            __APP_CONFIG__.backendURL + "/api/usage-docs/test-path",
        );

        expect(screen.getByText(mockMarkdownContent, { selector: 'p' })).toBeDefined();
    });

    test("handles fetch errors gracefully", async () => {
        fetch.mockRejectedValueOnce(new Error("Network error"));

        await act(async () => {
            render(<UserDocumentation />);
        });

        expect(
            screen.getByText(/The requested document could not be loaded/i),
        ).toBeDefined();
        expect(screen.getByText("Error")).toBeDefined();
        expect(screen.getByText(/Network Error/i)).toBeDefined();
    });

    test("displays error when document not found", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            text: () => Promise.resolve("Not found"),
        });

        await act(async () => {
            render(<UserDocumentation />);
        });

        expect(
            screen.getByText(/The requested document could not be loaded/i),
        ).toBeDefined();
        expect(screen.getByText("Error")).toBeDefined();
        expect(screen.getByText(/Document not found/i)).toBeDefined();
    });

    test("uses saved state when available", async () => {
        const savedContent = "Saved Content";

        await act(async () => {
            render(
                <UserDocumentation
                    savedState={{ content: savedContent, path: "saved-path" }}
                />,
            );
        });

        expect(screen.getByText(savedContent)).toBeDefined();
        expect(fetch).not.toHaveBeenCalled(); // Should use saved content
    });

    test("uses saved URL when content is empty", async () => {
        useParams.mockReturnValueOnce({});
        fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockMarkdownContent),
        });
        await act(async () => {
            render(<UserDocumentation savedState={{ path: "saved-path" }} />);
        });

        expect(screen.getByText(mockMarkdownContent)).toBeDefined();
        expect(fetch).toHaveBeenCalledWith(
            __APP_CONFIG__.backendURL + "/api/usage-docs/saved-path",
        );
    });

    test("uses initial data when available", async () => {
        const initialContent = "# Initial Content";


        await act(async () => {
            render(
                <UserDocumentation
                    initialData={{ content: initialContent, path: "initial-path" }}
                />,
            );
        });


        expect(screen.getByText(initialContent)).toBeDefined();
        expect(fetch).not.toHaveBeenCalled(); // Should use initial content
    });

    test("uses initial URL when content is empty", async () => {
        useParams.mockReturnValueOnce({});
        fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockMarkdownContent),
        });
        await act(async () => {
            render(<UserDocumentation initialData={{ path: "initial-path" }} />);
        });

        expect(screen.getByText(mockMarkdownContent)).toBeDefined();
        expect(fetch).toHaveBeenCalledWith(
            __APP_CONFIG__.backendURL + "/api/usage-docs/initial-path",
        );
    });

    test("notifies parent of state changes", async () => {
        const mockOnStateChange = vi.fn();

        await act(async () => {
            render(<UserDocumentation onStateChange={mockOnStateChange} />);
        });

        expect(mockOnStateChange).toHaveBeenCalledWith({
            content: mockMarkdownContent,
            path: "test-path",
        });
    });

    test("uses URL params when available", async () => {
        useParams.mockReturnValue({ path: "url-path" });
        await act(async () => {
            render(<UserDocumentation />);
        });

        expect(fetch).toHaveBeenCalledWith(
            __APP_CONFIG__.backendURL + "/api/usage-docs/url-path",
        );
    });

    test("applies different styling when opened as tab", async () => {
        let container;
        await act(async () => {
            container = render(<UserDocumentation onStateChange={vi.fn()} />).container;
        });

        const contentDiv = container.querySelector(".markdown-body");
        expect(contentDiv.classList).toContain("h-[82vh]")
    });

    test("renders markdown with remarkGfm plugin", async () => {
        await act(async () => {
            render(<UserDocumentation />);
        });

        expect(ReactMarkdown).toHaveBeenCalledWith(
            expect.objectContaining({
                children: mockMarkdownContent,
                remarkPlugins: expect.arrayContaining([expect.any(Function)])
            }),
            expect.toBeOneOf([expect.anything(), undefined, null]) // Options
        );
    });
});
