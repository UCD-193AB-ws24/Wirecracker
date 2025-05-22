import React, { useState, useEffect } from "react";
import { saveTestCSVFile } from "../../utils/CSVParser";
import config from "../../../config.json" with { type: 'json' };
import { useError } from '../../context/ErrorContext';
import { useWarning } from "../../context/WarningContext";
import mapConsecutive from "../../utils/MapConsecutive";

const backendURL = config.backendURL;

const FunctionalTestSelection = ({
    initialData = {},
    onStateChange,
    savedState = {},
}) => {
    const { showError } = useError();
    const { showWarning } = useWarning();
    const [allAvailableTests, setAllAvailableTests] = useState([] || savedState.allTests);
    
    const [contactPairs, setContactPairs] = useState(() => {
        if (savedState.contactPairs) return savedState.contactPairs;
        let contactsData = initialData.data?.data || initialData.data;
        if (contactsData && typeof contactsData === 'object' && !Array.isArray(contactsData) && contactsData.contacts) {
            // Iterate over the contacts and set isPlanning = true, since data from saved CSV is always true
            if (Array.isArray(contactsData.contacts)) {
                contactsData.contacts.forEach(contact => {
                    if (contact) { // Ensure contact is not null/undefined
                        contact.isPlanning = true;
                    }
                });
            }
            // Now reformat contactsData
            contactsData = [{ contacts: contactsData.contacts }];
        }
        if (contactsData) {
            return contactsData.map(electrode => {
                // Create pairs of consecutive contacts where at least one has a surgeon mark
                return mapConsecutive(electrode.contacts, 2, contacts => {
                    // Return the pair if either contact has a surgeon mark
                    return (contacts[0].surgeonMark && contacts[1].surgeonMark) ? contacts : null;
                });
            })
            .flat()
            .filter(Boolean)
            .sort((a, b) => a[0].order - b[0].order);
        }
        return [];
    });
    const [tests, setTests] = useState(() => {
        if (savedState.tests) return savedState.tests;
        if (initialData.tests) {
            let loadedTests = {};
            Object.entries(initialData.data.tests).map(([contactID, tests]) => { // for each contact
                loadedTests[contactID] = tests.map(test => {
                    if (!(test.name && test.region && test.description && test.population && test.disruptionRate && test.tag)) {
                        return allAvailableTests.find(candidate => candidate.id === test.id);
                    }
                    return test;
                })
            })
            return loadedTests;
        }

        return {};
    });
    const [availableTests, setAvailableTests] = useState(
        savedState.availableTests || [],
    );
    const [showPopup, setShowPopup] = useState(savedState.showPopup || false);
    const [selectedContact, setSelectedContact] = useState(
        savedState.selectedContact || null,
    );
    const [selectedTest, setSelectedTest] = useState(
        savedState.selectedTest || null,
    );
    const [expandedTests, setExpandedTests] = useState(
        savedState.expandedTests || [],
    ); // Tracks expanded tests uniquely
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const [state, setState] = useState(savedState);

    useEffect(() => {
        // Fetch tests from backend
        const fetchTests = async () => {
            try {
                const res = await fetch(`${backendURL}/api/get-tests`);
                if (!res.ok) throw new Error(`Error: ${res.status}`);
                const { data } = await res.json();
                setAllAvailableTests(data);
            } catch (err) {
                if (err.name === "NetworkError" || err.message.toString().includes("NetworkError")) {
                    showError("No internet connection. Unable to load tests");
                }
                console.error("Failed to fetch tests:", err);
            }
        };

        fetchTests();
    }, []);

    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        setState(() => {
            return {
                contactPairs: contactPairs,
                tests: tests,
                allTests: allAvailableTests,
                availableTests: availableTests,
                showPopup: showPopup,
                selectedContact: selectedContact,
                selectedTest: selectedTest,
                expandedTests: expandedTests,
                patientId: savedState.patientId,
                fileId: savedState.fileId,
                fileName: savedState.fileName,
                creationDate: savedState.creationDate,
                modifiedDate: savedState.modifiedDate
            };
        });
    }, [
        contactPairs,
        tests,
        allAvailableTests,
        availableTests,
        showPopup,
        selectedContact,
        selectedTest,
        expandedTests,
        savedState.patientId,
        savedState.fileId,
        savedState.fileName,
        savedState.creationDate,
        savedState.modifiedDate
    ]);

    // Function to select the best test based on population and disruption rate
    const selectBestTest = (availableTests) => {
        return availableTests.sort(
            (a, b) =>
                b.population - a.population ||
                b.disruptionRate - a.disruptionRate,
        )[0];
    };

    // Update availableTests whenever selectedContact changes
    useEffect(() => {
        if (selectedContact) {
            const filteredTests = allAvailableTests
                .filter(
                    (test) =>
                        test.region.includes(selectedContact.associatedLocation.toLowerCase()),
                )
                .filter(
                    (test) =>
                        !tests[selectedContact.id]?.some(
                            (t) => t.id === test.id,
                        ),
                )
                .sort(
                    (a, b) =>
                        b.population - a.population ||
                        b.disruptionRate - a.disruptionRate,
                );
            setAvailableTests(filteredTests);
        }
    }, [selectedContact, tests, allAvailableTests]);

    // Automatically assigns the best test to each contact
    const autoAssignTests = () => {
        const newTests = {};
        contactPairs.forEach((contactPair) => {
            const availableTests = allAvailableTests.filter(
                (test) => (test.region.includes(contactPair[0].associatedLocation.toLowerCase()) ||
                          (test.region.includes(contactPair[1].associatedLocation.toLowerCase())))
            );
            if (availableTests.length > 0) {
                const bestTest = selectBestTest(availableTests);
                newTests[contactPair[0].id] = [bestTest];
            }
        });
        setTests(newTests);
    };

    const handleAddTest = (contactPair) => {
        setSelectedContact(contactPair[0]);
        setShowPopup(true);
        setSelectedTest(null);
    };

    const confirmAddTest = () => {
        if (selectedContact && selectedTest) {
            setTests((prev) => ({
                ...prev,
                [selectedContact.id]: [
                    ...(prev[selectedContact.id] || []),
                    selectedTest,
                ],
            }));
        }
        setShowPopup(false);
    };

    const removeTest = (contactLabel, testIndex) => {
        setTests((prev) => ({
            ...prev,
            [contactLabel]: prev[contactLabel].filter(
                (_, index) => index !== testIndex,
            ),
        }));
    };

    // Toggle a single test's detail view uniquely
    const toggleTestDetails = (contactId, testId) => {
        const key = `${contactId}-${testId}`; // Unique key for each test instance
        setExpandedTests((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key); // Collapse if already expanded
            } else {
                newSet.add(key); // Expand if not expanded yet
            }
            return Array.from(newSet);
        });
    };

    const exportTests = async (tests, contacts, download = true) => {
        try {
            // First save to database if we have a file ID
            if (savedState.fileId) {
                console.log('Saving test selection to database...');
                console.log('Current state:', {
                    fileId: savedState.fileId,
                    patientId: savedState.patientId,
                    fileName: savedState.fileName
                });

                // Get user ID from session
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to save test selections.');
                    return;
                }

                try {
                    // Save/update test selection data
                    const response = await fetch(`${config.backendURL}/api/save-test-selection`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            tests: tests,
                            contacts: contacts,
                            fileId: savedState.fileId,
                            fileName: savedState.fileName,
                            creationDate: savedState.creationDate,
                            modifiedDate: new Date().toISOString(),
                            patientId: savedState.patientId
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('Failed to save test selection:', result.error);
                        throw new Error(result.error || 'Failed to save test selection');
                    }

                    // Only update the state with new modified date if the save was successful
                    // and we got a new modified date back
                    if (result.modifiedDate) {
                        setState(prevState => ({
                            ...prevState,
                            modifiedDate: result.modifiedDate
                        }));
                    }

                    // Show success feedback if this was a save operation
                    if (!download) {
                        setShowSaveSuccess(true);
                        setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
                    }

                    console.log('Test selection saved successfully');
                } catch (error) {
                    console.error('Error saving test selection:', error);
                    throw error;
                }
            }
        } catch (error) {
            if (error.name === "NetworkError" || (error.message && error.message.toString().includes("NetworkError"))) {
                if (download) {
                    showWarning("No internet connection. The progress is not saved on the database.");
                } else {
                    showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
                }
            } else {
                console.error("Error exporting contacts:", error);
                showError(`Error exporting contacts: ${error.message || 'Unknown error occurred'}`);
            }
        } finally {
            // Then export to CSV if download is true
            if (download) {
                saveTestCSVFile(tests, contacts, download);
            }
        }
    };

    const handleOpenStimulation = async () => {
        try {
            // Format the data for stimulation
            let stimulationData = initialData.data.contacts.map(electrode => ({
                ...electrode,
                contacts: electrode.contacts.map((contact, index) => {
                    let pair = index;
                    if (index == 0) pair = 2;
                    return {
                        ...contact,
                        pair: pair,
                        isPlanning: false,
                        duration: 3.0,
                        frequency: 105.225,
                        current: 2.445,
                    }
                }),
            }));

            // Create a new tab with the stimulation data
            const event = new CustomEvent('addStimulationTab', {
                detail: { 
                    data: stimulationData,
                    patientId: savedState.patientId,
                    state: {
                        patientId: savedState.patientId,
                        fileId: savedState.fileId,
                        fileName: savedState.fileName,
                        creationDate: savedState.creationDate,
                        modifiedDate: new Date().toISOString(),
                        testSelectionModifiedDate: savedState.modifiedDate,
                        fromTestSelection: true
                    }
                }
            });
            window.dispatchEvent(event);

            await exportTests(tests, initialData.data.contacts, false);
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error opening stimulation:', error);
                showError('Failed to open stimulation. Please try again.');
            }
        }
    };

    return (
        <div className="p-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Functional Test Selection
            </h1>

            {/* Auto Assign Button */}
            <button
                className="mb-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={autoAssignTests}
            >
                Auto-Assign Best Tests
            </button>

            <div className="bg-white py-4 px-40 shadow-md rounded-lg">
                {contactPairs.map((contactPair) => (
                    <div
                        key={contactPair[0].id}
                        className="border p-4 mb-4 rounded-lg shadow-sm bg-gray-100"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg">
                                {contactPair[0].id}-{contactPair[1].id}
                            </span>
                            <span className="text-gray-600 text-sm">
                                {contactPair[0].associatedLocation} - {contactPair[1].associatedLocation}
                            </span>
                        </div>

                        {/* Display added tests */}
                        <div className="mt-2">
                            {tests[contactPair[0].id]?.map((test, index) => {
                                const testKey = `${contactPair[0].id} - ${test.id}`;
                                return (
                                    <div
                                        key={index}
                                        className="bg-blue-100 p-3 rounded mt-1 cursor-pointer"
                                        onClick={() =>
                                            toggleTestDetails(
                                                contactPair[0].id,
                                                test.id,
                                            )
                                        }
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">
                                                    {test.name}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {test.tag.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-gray-300 text-xs text-gray-700 px-2 py-1 rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeTest(
                                                        contactPair[0].id,
                                                        index,
                                                    );
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="text-xs text-gray-700">
                                            Population: {test.population} |
                                            Disruption: {test.disruptionRate}%
                                        </div>

                                        {expandedTests.includes(testKey) && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm relative">
                                                <p className="text-gray-600">
                                                    {test.description}
                                                </p>
                                                <a
                                                    href="https://example.com"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                                                >
                                                    More Details
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add test button */}
                        <button
                            className="mt-2 w-full text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => handleAddTest(contactPair)}
                        >
                            + Add Test
                        </button>
                    </div>
                ))}
            </div>

            {/* Test Selection Popup */}
            {showPopup && selectedContact && (
                <div className="fixed inset-0 bg-black/25 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[450px]">
                        <h2 className="text-lg font-bold mb-4">
                            Select a Test for {selectedContact.id}
                        </h2>
                        <div className="overflow-y-auto max-h-[350px]">
                            {availableTests.map((test) => {
                                const testKey = `${selectedContact.id}-${test.id}`; // Use the same key format as elsewhere
                                return (
                                    <div
                                        key={test.id}
                                        className={`p-3 rounded cursor-pointer ${
                                            selectedTest?.id === test.id
                                                ? "bg-blue-200"
                                                : "hover:bg-gray-200"
                                        }`}
                                        onClick={() => {
                                            if (selectedTest?.id === test.id) {
                                                toggleTestDetails(
                                                    selectedContact.id,
                                                    test.id,
                                                ); // Use the correct key format
                                            } else {
                                                setSelectedTest(test);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">
                                                    {test.name}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {test.tag.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-gray-300 text-xs text-gray-700 px-2 py-1 rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-700">
                                            Population: {test.population} |
                                            Disruption: {test.disruptionRate}%
                                        </div>
                                        {expandedTests.includes(testKey) && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm relative">
                                                <p className="text-gray-600">
                                                    {test.description}
                                                </p>
                                                <a
                                                    href="https://example.com"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                                                >
                                                    More Details
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {availableTests.length === 0 && (
                                <p className="text-center text-gray-600">
                                    No tests available.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className={`bg-gray-500 text-white mx-4 py-2 rounded hover:bg-gray-700 ${
                                    availableTests.length === 0
                                        ? "w-1/1"
                                        : "w-1/2"
                                }`}
                                onClick={() => setShowPopup(false)}
                            >
                                Cancel
                            </button>
                            {availableTests.length === 0 ? (
                                <div></div>
                            ) : (
                                <button
                                    className={`w-1/2 text-white mx-4 py-2 rounded ${
                                        !selectedTest
                                            ? "bg-gray-500"
                                            : "bg-blue-500 hover:bg-blue-700"
                                    }`}
                                    onClick={confirmAddTest}
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="fixed bottom-6 right-6 z-50 flex gap-2">
                <div className="relative">
                    <button
                        className="py-2 px-4 bg-green-500 text-white font-bold rounded hover:bg-green-700 border border-green-700 shadow-lg"
                        onClick={() => exportTests(tests, initialData.data?.data || initialData.data, false)}
                    >
                        Save
                    </button>
                    {showSaveSuccess && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                            Save successful!
                        </div>
                    )}
                </div>
                <button
                    className="py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700 shadow-lg"
                    onClick={() => exportTests(tests, initialData.data?.data || initialData.data)}
                >
                    Export
                </button>
                <button
                    className="py-2 px-4 bg-purple-500 text-white font-bold rounded hover:bg-purple-700 border border-purple-700 shadow-lg"
                    onClick={handleOpenStimulation}
                >
                    Open in Stimulation
                </button>
            </div>
        </div>
    );
};

export default FunctionalTestSelection;
