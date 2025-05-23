import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../../docs/styles/github-markdown-light.css";

const backendURL = __APP_CONFIG__.backendURL;

/**
 * @module UserDocumentation
 */

/**
 * A component for displaying user documentation from markdown files.
 * @component
 * @param {Object} [initialData] - Initial data. Contain path and content. If content is defined,
 *                  this component will not fetch and display the passed content. Otherwise will fetch the path.
 * @param {Function} onStateChange - Call back function to let parent component know about state change
 * @param {Object} [savedState] - Saved state. Contain path and content. If content is defined,
 *                  this component will not fetch and display the passed content. Otherwise will fetch the path.
 * @returns {JSX.Element} Rendered documentation component
 * @example
 * // Basic usage
 * <UserDocumentation />
 *
 * // To open this page as new tab, dispatch event as follows
 * const event = new CustomEvent('addDocumentationTab', {
 *     detail: {
 *
 *         // String
 *         path: 'stimulation',
 *
 *         // Markdown String
 *         // If content is defined, the component will display that instead of fetching the path.
 *         // Otherwise it will fetch using the path
 *         content: "Content"
 *     }
 * });
 * window.dispatchEvent(event);
 */
const UserDocumentation = ({
    initialData = {},
    onStateChange,
    savedState = {},
}) => {
    const [markdownContent, setMarkdownContent] = useState(
        savedState.content || initialData.content || null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [path, _] = useState(
        useParams().path || savedState.path || initialData.path,
    );

    /**
     * Notify parent component of state changes
     */
    useEffect(() => {
        if (onStateChange) {
            onStateChange({
                content: markdownContent,
                path: path,
            });
        }
    }, [markdownContent, path]);

    /**
     * Fetch documentation from path if content is null
     */
    useEffect(() => {
        if (!markdownContent) {
            fetchDocumentation(path);
        }
    }, []);

    /**
     * Fetches documentation content from the backend
     * @async
     * @param {string} path - The documentation path to fetch
     */
    const fetchDocumentation = async (path) => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch the markdown through backend
            const response = await fetch(
                `${backendURL}/api/usage-docs/${path}`,
            );
            if (!response.ok) {
                throw new Error("Document not found");
            }

            const data = await response.text();
            setMarkdownContent(data);
        } catch (err) {
            setError(err.message);
            setMarkdownContent(
                `# **The requested document could not be loaded.**`,
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" data-testid="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {error && (
                <div
                    className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
                    role="alert"
                >
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Different style depending on how it was opened - onStateChange is set means it is opened as a tab */}
            <div
                className={
                    onStateChange
                        ? "h-[82vh] overflow-scroll markdown-body"
                        : "overflow-scroll markdown-body"
                }
            >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default UserDocumentation;
