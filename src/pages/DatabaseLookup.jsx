import { useState, useEffect, useCallback } from "react";
import config from "../../config.json" with { type: "json" };

const backendURL = config.backendURL;

const DBLookup = ({ initialData = {}, onStateChange, savedState = {} }) => {

    const ItemTypes = Object.freeze({
        CORT:       "Cortical/Subcortical",
        GM:         "Gray Matter",
        FUNCTION:   "Function",
        TEST:       "Test"
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
            });
        }
    }, [parameters, searchResult, showFilters, query]);

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

        // Helper function to add item if it doesn't exist
        const addItem = (item, type) => {
            if (!item || !item.id) return;
            const exists = results.some(
                (r) => r.type === type && r.id === item.id,
            );
            if (!exists) {
                let relatedItems = [];
                switch (type) {
                    case ItemTypes.CORT:
                        for (let relatedGM in item.cort_gm) {
                            relatedItems.push({
                                type: ItemTypes.GM,
                                name: item.cort_gm[relatedGM].gm.name,
                            });
                        }
                        break;
                    case ItemTypes.GM:
                        for (let relatedCort in item.cort_gm) {
                            relatedItems.push({
                                type: ItemTypes.CORT,
                                name: item.cort_gm[relatedCort].cort.name,
                            });
                        }
                        for (let relatedFunc in item.gm_function) {
                            relatedItems.push({
                                type: ItemTypes.FUNCTION,
                                name: item.gm_function[relatedFunc].function
                                    .name,
                            });
                        }
                        break;
                    case ItemTypes.FUNCTION:
                        for (let relatedTest in item.test) {
                            relatedItems.push({
                                type: ItemTypes.TEST,
                                name: item.test[relatedTest].name,
                            });
                        }
                        break;
                    case ItemTypes.TEST:
                        for (let relatedFunc in item.function) {
                            relatedItems.push({
                                type: ItemTypes.FUNCTION,
                                name: item.function[relatedFunc].name,
                            });
                        }
                        break;
                }
                results.push({
                    type,
                    id: item.id,
                    name:
                        item.name ||
                        item.title ||
                        item.acronym ||
                        `Reference ${item.isbn_issn_doi}`,
                    details: getItemDetails(item, type),
                    related: relatedItems,
                });
            }
        };

        // Helper to get display details for each item type
        const getItemDetails = (item, type) => {
            switch (type) {
                case ItemTypes.CORT:
                    return {
                        hemisphere: item.hemisphere,
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

        // Process all data and collect items
        data.cort?.forEach((cort) => addItem(cort, ItemTypes.CORT));
        data.gm?.forEach((gm) => addItem(gm, ItemTypes.GM));
        data.functions?.forEach((func) => addItem(func, ItemTypes.FUNCTION));
        data.tests?.forEach((test) => addItem(test, ItemTypes.TEST));

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
            return { ...prev, hemisphere: newHemisphere };
        });
    };

    const handleLobeChange = (lobe) => {
        setParameters((prev) => {
            const newLobe = prev.lobe.includes(lobe)
                ? prev.lobe.filter((l) => l !== lobe)
                : [...prev.lobe, lobe];
            return { ...prev, lobe: newLobe };
        });
    };

    const renderResultsTable = () => {
        if (searchResult.length === 0) {
            return (
                <p>No results to display. Perform a search to see results.</p>
            );
        }

        return (
            <div>
                <h3 className="text-lg font-semibold mb-2">
                    Results ({searchResult.length})
                </h3>
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
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                    Related Result
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
                                    <td className="px-4 py-2 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="px-4 py-2">
                                        {item.type === ItemTypes.CORT && (
                                            <div className="space-y-1">
                                                <div>
                                                    <span className="text-gray-500">
                                                        Hemisphere:
                                                    </span>{" "}
                                                    {item.details.hemisphere}
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
                                        {item.type === ItemTypes.FUNCTION && (
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
                                                {item.related.map((rel, i) => (
                                                    <div
                                                        key={i}
                                                        className="text-xs bg-gray-100 rounded px-2 py-1"
                                                    >
                                                        <span className="font-medium capitalize">
                                                            {rel.type}:
                                                        </span>{" "}
                                                        {rel.name}
                                                    </div>
                                                ))}
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
            </div>
        );
    };

    return (
        <div className="flex flex-col p-4 space-y-4 relative">
            <h2 className="text-2xl font-semibold">Database Lookup</h2>

            {/* Search Bar */}
            <form onSubmit={handleSearch} onReset={handleReset}>
                <div className="flex w-full mb-4 relative">
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
                        className="ml-2 px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="ml-2 px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                    {isLoading && (
                        <div className="absolute right-0 -bottom-6 text-sm text-gray-500">
                            Loading...
                        </div>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {activeSuggestions && suggestions.length > 0 && (
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
                    <div className="w-1/4 space-y-4">
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
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
