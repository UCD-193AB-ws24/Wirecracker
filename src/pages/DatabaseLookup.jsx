import { useState, useEffect, useCallback, useRef } from "react";
import * as d3 from "d3";

const backendURL = __APP_CONFIG__.backendURL;

const DBLookup = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const ItemTypes = Object.freeze({
        CORT: "Cortical/Subcortical",
        GM: "Gray Matter",
        FUNCTION: "Function",
        TEST: "Test",
    });

    const [query, setQuery] = useState(
        savedState.query || initialData.query || "",
    );
    const [parameters, setParameters] = useState(
        savedState.parameters ||
            initialData.parameters || {
                hemisphere: [],
                lobe: [],
            },
    );
    const [searchResult, setSearchResult] = useState(savedState.results || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestions, setActiveSuggestions] = useState(false);
    const [lobeOptions, setLobeOptions] = useState([]);
    const [showFilters, setShowFilters] = useState(savedState.filter || false);
    const debounceTimer = useRef(null);

    const graphRef = useRef(null);
    const [graphDimensions, setGraphDimensions] = useState({
        width: 800,
        height: 600,
    });
    const [graphView, setGraphView] = useState(savedState.graphView || false); // Toggle between table and graph view

    // Color scale for different node types
    const colorScale = d3
        .scaleOrdinal()
        .domain([
            ItemTypes.CORT,
            ItemTypes.GM,
            ItemTypes.FUNCTION,
            ItemTypes.TEST,
        ])
        .range(["#4e79a7", "#f28e2b", "#e15759", "#76b7b2"]);

    useEffect(() => {
        // Fetch lobe options from backend
        const fetchLobeOptions = async () => {
            try {
                const res = await fetch(`${backendURL}/api/lobe-options`);
                if (!res.ok) throw new Error(`Error: ${res.status}`);
                const data = await res.json();
                setLobeOptions(data.lobes);
            } catch (err) {
                console.error("Failed to fetch lobe options:", err);
            }
        };

        fetchLobeOptions();
    }, []);

    useEffect(() => {
        if (onStateChange) {
            onStateChange({
                parameters,
                results: searchResult,
                filter: showFilters,
                query: query,
                graphView: graphView,
            });
        }
    }, [parameters, searchResult, showFilters, query, graphView]);

    const performSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = {
                query,
                ...Object.fromEntries(
                    Object.entries(parameters).filter(
                        ([_, v]) => v !== "" && v.length !== 0,
                    ),
                ),
            };

            const res = await fetch(`${backendURL}/api/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryParams),
            });

            if (!res.ok) throw new Error(`Error: ${res.status}`);
            const data = await res.json();

            // Transform the data for display
            const transformedResults = transformSearchResults(data);
            console.log(transformedResults)
            setSearchResult(transformedResults);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [query, parameters]);

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch();
    };

    const fetchSuggestions = async (input) => {
        if (!input) return;
        try {
            const res = await fetch(`${backendURL}/api/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });
            if (!res.ok) throw new Error(`Error: ${res.status}`);
            const data = await res.json();
            setSuggestions(data.suggestions);
        } catch (err) {
            console.error("Failed to fetch suggestions:", err);
        }
    };

    const transformSearchResults = (data) => {
        const results = [];
        const searchString = query.toLowerCase();

        // Helper function to check if text contains the search string
        const containsString = (text) => {
            if (!text) return false;
            return text.toString().toLowerCase().includes(searchString);
        };

        // Helper function to determine relevance level
        const getRelevanceLevel = (item, type) => {
            // Level 1: Name matches
            if (containsString(item.name || item.title)) return 1;

            // Level 2: Acronym or description matches
            if (
                containsString(item.acronym) ||
                containsString(item.description) ||
                containsString(item.lobe)
            )
                return 2;

            // Default to level 4 (will be upgraded if direct relationships found)
            return 4;
        };

        // Helper function to add item if it doesn't exist
        const addItem = (item, type, relevance = null) => {
            if (!item || !item.id) return;

            const existsIndex = results.findIndex(
                (r) => r.type === type && r.id === item.id,
            );

            const relevanceLevel =
                relevance !== null ? relevance : getRelevanceLevel(item, type);

            if (existsIndex === -1) {
                let relatedItems = [];
                switch (type) {
                    case ItemTypes.CORT:
                        item.name = `${item.hemisphere === 'l' ? 'Left' : 'Right'} ${item.name}`
                        for (let relatedGM in item.cort_gm) {
                            relatedItems.push({
                                id: item.cort_gm[relatedGM].gm.id,
                                type: ItemTypes.GM,
                                name: item.cort_gm[relatedGM].gm.name,
                                reference: item.cort_gm[relatedGM].reference,
                            });
                        }
                        break;
                    case ItemTypes.GM:
                        for (let relatedCort in item.cort_gm) {
                            relatedItems.push({
                                id: item.cort_gm[relatedCort].cort.id,
                                type: ItemTypes.CORT,
                                name: item.cort_gm[relatedCort].cort.name,
                                reference: item.cort_gm[relatedCort].reference,
                            });
                        }
                        for (let relatedFunc in item.gm_function) {
                            relatedItems.push({
                                id: item.gm_function[relatedFunc].function.id,
                                type: ItemTypes.FUNCTION,
                                name: item.gm_function[relatedFunc].function
                                    .name,
                                reference: item.gm_function[relatedFunc].reference,
                            });
                        }
                        break;
                    case ItemTypes.FUNCTION:
                        for (let relatedGM in item.gm_function) {
                            relatedItems.push({
                                id: item.gm_function[relatedGM].gm.id,
                                type: ItemTypes.GM,
                                name: item.gm_function[relatedGM].gm.name,
                                reference: item.gm_function[relatedGM].reference,
                            });
                        }
                        for (let relatedTest in item.function_test) {
                            relatedItems.push({
                                id: item.function_test[relatedTest].test.id,
                                type: ItemTypes.TEST,
                                name: item.function_test[relatedTest].test.name,
                                reference: item.function_test[relatedTest].reference,
                            });
                        }
                        break;
                    case ItemTypes.TEST:
                        for (let relatedFunc in item.function_test) {
                            relatedItems.push({
                                id: item.function_test[relatedFunc].function.id,
                                type: ItemTypes.FUNCTION,
                                name: item.function_test[relatedFunc].function
                                    .name,
                                reference: item.function_test[relatedFunc].reference,
                            });
                        }
                        break;
                }

                results.push({
                    type,
                    id: item.id,
                    name: item.name,
                    details: getItemDetails(item, type),
                    related: relatedItems,
                    relevance: relevanceLevel,
                });
            } else if (relevanceLevel < results[existsIndex].relevance) {
                // Update with better relevance if found
                results[existsIndex].relevance = relevanceLevel;
            }
        };

        // Helper to get display details for each item type
        const getItemDetails = (item, type) => {
            switch (type) {
                case ItemTypes.CORT:
                    const side = item.hemisphere === 'l' ? 'left' : 'right';
                    return {
                        hemisphere: side,
                        lobe: item.lobe,
                        electrode_label: item.electrode_label,
                        acronym: item.acronym,
                    };
                case ItemTypes.GM:
                    return { acronym: item.acronym };
                case ItemTypes.FUNCTION:
                    return { description: item.description };
                case ItemTypes.TEST:
                    return { description: item.description };
                default:
                    return {};
            }
        };

        // add all items with their direct relevance
        data.cort?.forEach((cort) => addItem(cort, ItemTypes.CORT));
        data.gm?.forEach((gm) => addItem(gm, ItemTypes.GM));
        data.functions?.forEach((func) => addItem(func, ItemTypes.FUNCTION));
        data.tests?.forEach((test) => addItem(test, ItemTypes.TEST));

        // find direct relationships (level 3)
        const directlyRelated = new Set();
        results.forEach((item) => {
            if (item.relevance <= 2) {
                // If item is level 1 or 2
                item.related?.forEach((rel) => {
                    directlyRelated.add(`${rel.type}-${rel.id}`);
                });
            }
        });

        // Update relevance for directly related items
        results.forEach((item) => {
            const itemKey = `${item.type}-${item.id}`;
            if (directlyRelated.has(itemKey) && item.relevance > 3) {
                item.relevance = 3;
            }
        });

        // Sort results by relevance (lower numbers first)
        results.sort((a, b) => a.relevance - b.relevance);

        return results;
    };

    const handleReset = () => {
        setQuery("");
        setParameters({ hemisphere: [], lobe: [] });
        setSearchResult([]);
        setSuggestions([]);
        setError(null);
    };

    const handleHemisphereChange = (side) => {
        setParameters((prev) => {
            const newHemisphere = prev.hemisphere.includes(side)
                ? prev.hemisphere.filter((h) => h !== side)
                : [...prev.hemisphere, side];
            const newParams = { ...prev, hemisphere: newHemisphere };

            if (searchResult.length > 0 || query) {
                if (searchResult.length > 0 || query) {
                    clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(() => {
                        performSearch();
                    }, 300); // 300ms delay
                }
            }
            return newParams;
        });
    };

    const handleLobeChange = (lobe) => {
        setParameters((prev) => {
            const newLobe = prev.lobe.includes(lobe)
                ? prev.lobe.filter((l) => l !== lobe)
                : [...prev.lobe, lobe];
            const newParams = { ...prev, lobe: newLobe };

            if (searchResult.length > 0 || query) {
                if (searchResult.length > 0 || query) {
                    clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(() => {
                        performSearch();
                    }, 300); // 300ms delay
                }
            }
            return newParams;
        });
    };

    useEffect(() => {
        if ((searchResult.length > 0 || query) && Object.keys(parameters).length > 0) {
            if (searchResult.length > 0 || query) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(() => {
                    performSearch();
                }, 300); // 300ms delay
            }
        }
    }, [parameters.hemisphere, parameters.lobe]);

    // Add this useEffect to handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (graphRef.current) {
                const width = graphRef.current.clientWidth;
                const height = Math.min(600, window.innerHeight - 200);
                setGraphDimensions({ width, height });
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (graphView && searchResult.length > 0 && graphRef.current) {
            const cleanup = renderGraph();
            return () => {
                // Clean up when switching views or unmounting
                if (graphRef.current) {
                    d3.select(graphRef.current).selectAll("*").remove();
                }
                if (cleanup) cleanup();
            };
        } else {
            // Ensure clean removal when not in graph view
            if (graphRef.current) {
                d3.select(graphRef.current).selectAll("*").remove();
            }
        }
    }, [searchResult, graphView, graphDimensions]);

    const renderGraph = () => {
        // Helper function to wrap long labels
        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/),
                    word,
                    line = [],
                    lineHeight = 1.2, // ems
                    dy = -2 * lineHeight,
                    tspan = text
                        .text(null)
                        .append("tspan")
                        .attr("text-anchor", "middle")
                        .attr("dy", dy + "em");
                while ((word = words.pop())) {
                    line = [word, ...line];
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.shift();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text
                            .append("tspan")
                            .attr("text-anchor", "middle")
                            .attr("dy", dy + lineHeight + "em")
                            .attr("dx", -tspan.node().getComputedTextLength())
                            .text(word);
                    }
                }
            });
        }

        // Clear previous graph completely
        const container = d3.select(graphRef.current);
        container.selectAll("*").remove();

        // Prepare nodes and links data
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        // Create nodes from search results
        searchResult.forEach((item, index) => {
            const nodeId = `${item.type}-${item.id}`;
            nodeMap.set(nodeId, index);
            nodes.push({
                id: nodeId,
                name: item.name,
                type: item.type,
                details: item.details,
                // Store the original item for relationship lookup
                originalItem: item,
            });
        });

        // Create links from related items - FIXED LINK CREATION
        nodes.forEach((sourceNode, sourceIndex) => {
            sourceNode.originalItem.related?.forEach((rel) => {
                // Create target ID in the same format as node IDs
                const targetId = `${rel.type}-${rel.id}`;
                const targetIndex = nodeMap.get(targetId);

                // Only create link if target exists and it's not linking to itself
                if (targetIndex !== undefined && targetIndex !== sourceIndex) {
                    links.push({
                        source: sourceIndex,
                        target: targetIndex,
                        value: 1,
                    });
                }
            });
        });

        // Create the force simulation with proper node references
        const simulation = d3
            .forceSimulation(nodes)
            .force(
                "link",
                d3
                    .forceLink(links)
                    .id((d) => nodes.indexOf(d)) // Use node index as ID
                    .distance(130),
            )
            .force("charge", d3.forceManyBody().strength(-20))
            .force(
                "center",
                d3.forceCenter(
                    graphDimensions.width / 2,
                    graphDimensions.height / 2,
                ),
            )
            .force("collision", d3.forceCollide().radius(40));

        // Create SVG container with Tailwind classes
        const svg = container
            .append("svg")
            .attr("class", "w-full h-full")
            .attr(
                "viewBox",
                `0 0 ${graphDimensions.width} ${graphDimensions.height}`,
            )
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Add zoom behavior
        const zoom = d3
            .zoom()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        const g = svg.append("g");

        // Draw links
        const link = g
            .append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "stroke-gray-400 stroke-opacity-60 stroke-2")
            .attr("stroke", "#999") // Explicit color as fallback
            .attr("stroke-width", 2);

        // Create a size scale based on relevance
        const sizeScale = d3
            .scaleLinear()
            .domain([1, 4]) // Relevance levels from 1 (highest) to 4 (lowest)
            .range([20, 10]); // Size range from 30px (largest) to 15px (smallest)

        // Draw nodes
        const node = g
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", (d) => sizeScale(d.originalItem.relevance))
            .attr("fill", (d) => colorScale(d.type))
            .attr("class", "stroke-white stroke-2")
            .call(drag(simulation));

        // Add labels
        const label = g
            .append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr(
                "class",
                (d) =>
                    `text-xs text-[${12 - d.originalItem.relevance}px] fill-gray-800 max-w-24`,
            )
            .text((d) => d.name)
            .call(wrap, 120);

        // Add node type indicators
        const typeLabel = g
            .append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr("dy", (d) => 30 - d.originalItem.relevance * 3)
            .attr("text-anchor", "middle")
            .attr("class", "text-[8px] fill-gray-600")
            .text((d) => d.type.split("/")[0]);

        // Tooltip with Tailwind classes
        const tooltip = d3
            .select("body")
            .append("div")
            .attr(
                "class",
                "fixed invisible bg-white border border-gray-200 rounded p-2 pointer-events-none z-50 max-w-[300px] shadow-md",
            );

        // Add interactivity
        node.on("mouseover", (event, d) => {
            tooltip
                .html(
                    `
                    <strong class="font-semibold">${d.name}</strong><br>
                    <em class="text-gray-600">${d.type}</em><br>
                    ${formatDetails(d.details)}
                `,
                )
                .classed("invisible", false)
                .classed("visible", true);
        })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", `${event.pageY - document.body.scrollTop}px`)
                    .style("left", `${event.pageX}px`);
            })
            .on("mouseout", () => {
                tooltip.classed("invisible", true).classed("visible", false);
            });

        // Update positions on each tick
        simulation.on("tick", () => {
            link.attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

            label.attr("x", (d) => d.x).attr("y", (d) => d.y);

            typeLabel.attr("x", (d) => d.x).attr("y", (d) => d.y);
        });

        // Drag functions
        function drag(simulation) {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            return d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        // Helper to format details for tooltip
        function formatDetails(details) {
            if (!details) return "";
            return Object.entries(details)
                .map(
                    ([key, value]) =>
                        `<span class="text-gray-500">${key}:</span> ${value}`,
                )
                .join("<br>");
        }

        // Return cleanup function
        return () => {
            simulation.stop();
            tooltip.remove();
        };
    };

    const renderResultsTable = () => {
        if (searchResult.length === 0) {
            return (
                <p>No results to display. Perform a search to see results.</p>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                        Results ({searchResult.length})
                    </h3>
                    <button
                        onClick={() => {
                            setGraphView(!graphView);
                            // Force a re-render by resetting the graph dimensions
                            const container = d3.select(graphRef.current);
                            container.selectAll("*").remove();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        {graphView ? "Show Table" : "Show Graph"}
                    </button>
                </div>

                {graphView ? (
                    <div
                        ref={graphRef}
                        className="border rounded bg-white w-full h-[600px]"
                    />
                ) : (
                    <div className="overflow-auto border rounded">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                        Name
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                        Details
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700 w-1/2">
                                        Related Results
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {searchResult.map((item) => (
                                    <tr
                                        key={`${item.type}-${item.id}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-2 capitalize">
                                            {item.type}
                                        </td>
                                        <td className="px-4 py-2 font-medium capitalize">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.type === ItemTypes.CORT && (
                                                <div className="space-y-1">
                                                    <div>
                                                        <span className="text-gray-500">
                                                            Hemisphere:
                                                        </span>{" "}
                                                        {
                                                            item.details
                                                                .hemisphere
                                                        }
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">
                                                            Lobe:
                                                        </span>{" "}
                                                        {item.details.lobe}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">
                                                            Electrode:
                                                        </span>{" "}
                                                        {
                                                            item.details
                                                                .electrode_label
                                                        }
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">
                                                            Acronym:
                                                        </span>{" "}
                                                        {item.details.acronym}
                                                    </div>
                                                </div>
                                            )}
                                            {item.type === ItemTypes.GM && (
                                                <div>
                                                    <span className="text-gray-500">
                                                        Acronym:
                                                    </span>{" "}
                                                    {item.details.acronym}
                                                </div>
                                            )}
                                            {item.type ===
                                                ItemTypes.FUNCTION && (
                                                <div>
                                                    <span className="text-gray-500">
                                                        Description:
                                                    </span>{" "}
                                                    {item.details.description}
                                                </div>
                                            )}
                                            {item.type === ItemTypes.TEST && (
                                                <div>
                                                    <span className="text-gray-500">
                                                        Description:
                                                    </span>{" "}
                                                    {item.details.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.related?.length > 0 ? (
                                                <div className="space-y-1">
                                                    {item.related.map(
                                                        (rel, i) => (
                                                            <div
                                                                key={i}
                                                                className="text-xs bg-gray-100 rounded px-2 py-1"
                                                            >

                                                                {rel.reference ? (
                                                                    <details className="flex cursor-pointer">
                                                                        <summary>
                                                                            <span className="font-medium capitalize">
                                                                                {rel.type}:
                                                                            </span>{" "}
                                                                            <span className="capitalize">
                                                                                {rel.name}
                                                                            </span>
                                                                        </summary>
                                                                        <p className="pl-5">
                                                                            {`${rel.reference.authors}. (${rel.reference.publication_date}). ${rel.reference.title}. `}
                                                                            <i>{`${rel.reference.publisher}.`}</i>
                                                                            {` doi:${rel.reference.isbn_issn_doi}`}
                                                                        </p>
                                                                    </details>
                                                                ) : (
                                                                    <div>
                                                                        <span className="font-medium capitalize">
                                                                            {rel.type}:
                                                                        </span>{" "}
                                                                        <span className="capitalize">
                                                                            {rel.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    None
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col mx-10 p-4 space-y-4 relative">
            <h2 className="text-2xl font-semibold">Database Lookup</h2>

            {/* Search Bar */}
            <form onSubmit={handleSearch} onReset={handleReset}>
                <div className="flex gap-2 w-full mb-4 relative">
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                    <input
                        type="text"
                        className="flex-grow p-2 border rounded-l-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search database..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            fetchSuggestions(e.target.value);
                            setActiveSuggestions(true);
                        }}
                        onFocus={() => setActiveSuggestions(true)}
                        onBlur={() =>
                            setTimeout(() => setActiveSuggestions(false), 200)
                        }
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? "Searching..." : "Search"}
                    </button>
                    <button
                        type="reset"
                        className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                    >
                        Reset
                    </button>
                    {isLoading && (
                        <div className="absolute right-0 -bottom-6 text-sm text-gray-500">
                            Loading...
                        </div>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {activeSuggestions && suggestions && suggestions.length > 0 && (
                    <ul className="bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto absolute z-10 w-full">
                        {suggestions.map((sug, i) => (
                            <li
                                key={i}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    setQuery(sug);
                                    setActiveSuggestions(false);
                                }}
                            >
                                {sug}
                            </li>
                        ))}
                    </ul>
                )}
            </form>

            <div className="flex gap-4">
                {showFilters && (
                    <div className="w-1/6 space-y-4">
                        <h3 className="text-lg font-semibold">Filters</h3>

                        {/* Hemisphere Checkboxes */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Hemisphere
                            </label>
                            <div className="flex gap-2">
                                {["left", "right"].map((side) => (
                                    <label
                                        key={side}
                                        className="inline-flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={parameters.hemisphere.includes(
                                                side,
                                            )}
                                            onChange={() =>
                                                handleHemisphereChange(side)
                                            }
                                            className="rounded border-gray-300 text-blue-600
                                                       cursor-pointer focus:ring-blue-500"
                                        />
                                        {side.charAt(0).toUpperCase() +
                                            side.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Lobe Checkboxes */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Lobe
                            </label>
                            <div className="space-y-2">
                                {lobeOptions.map((lobe) => (
                                    <label
                                        key={lobe}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={parameters.lobe.includes(
                                                lobe,
                                            )}
                                            onChange={() =>
                                                handleLobeChange(lobe)
                                            }
                                            className="rounded border-gray-300 text-blue-600
                                                       cursor-pointer focus:ring-blue-500"
                                        />
                                        {lobe}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className={showFilters ? "w-3/4" : "w-full"}>
                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {renderResultsTable()}
                </div>
            </div>
        </div>
    );
};

export default DBLookup;
