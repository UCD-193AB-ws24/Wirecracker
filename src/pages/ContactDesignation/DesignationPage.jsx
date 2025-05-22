import React, { useState, useEffect } from 'react';
import { saveDesignationCSVFile } from "../../utils/CSVParser";
import { useError } from '../../context/ErrorContext';
import config from "../../../config.json" with { type: 'json' };

const backendURL = config.backendURL;

/**
 * @module Designation
 */

/**
 *
 * Designation page to mark each contacts to be either onset zone, epilepsy network, not involved, or out of brain.
 * Default is not involved.
 *
 * @component
 * @param {Object} [initialData] - Initial data for electrodes
 * @param {Function} onStateChange - Callback for state changes
 * @param {Object} [savedState] - Saved state data
 * @returns {JSX.Element} Designation component
 *
 */
const Designation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    // Function to show error at the top of the screen
    const { showError } = useError();
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    /**
     * Store original localization for saving / exporting later
     */
    const [localizationData, setLocalizationData] = useState(() => {
        if (savedState && savedState.localizationData) {
            return JSON.parse(JSON.stringify(savedState.localizationData));
        }
        return initialData?.originalData ? JSON.parse(JSON.stringify(initialData.originalData)) : null;
    });

    /**
     * Store electrodes data
     */
    const [electrodes, setElectrodes] = useState(() => {
        // If there are previous state that can be recalled
        if (savedState && savedState.electrodes) {
            return JSON.parse(JSON.stringify(savedState.electrodes));
        }

        // New page, made from localization page. Process data here.
        if (initialData && Object.keys(initialData).length !== 0) {
            return initialData.data.map(electrode => ({
                ...electrode,
                contacts: electrode.contacts.map((contact, index) => ({
                    ...contact,
                    id: `${electrode.label}${index + 1}`,
                    electrodeLabel: electrode.label,
                    index: index + 1,
                    mark: contact.mark || 0,
                    surgeonMark: contact.surgeonMark || false,
                    focus: false
                })),
            }));
        }
    });

    // States for filtering function
    const [filterChar, setFilterChar] = useState('');
    const [filteredElectrodes, setFilteredElectrodes] = useState(electrodes);

    // Save state changes into tab's localstorage using callback function
    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        const newState = {
            ...state,
            electrodes: electrodes,
            localizationData: localizationData
        };
        setState(newState);
    }, [electrodes, localizationData]);

    /**
     * Handles contact click event
     * @param {string} contactId - ID of the clicked contact
     * @param {Function} change - Function to modify contact state
     */
    const onClick = (contactId, change) => {
        setElectrodes(prevElectrodes => {
            return prevElectrodes.map(electrode => ({
                ...electrode,
                contacts: electrode.contacts.map(contact => {
                    if (contact.id === contactId) {
                        return change(contact);
                    }
                    return contact;
                }),
            }));
        });
    };

    // Handle filtering whenever filter character changes
    useEffect(() => {
        if (filterChar === '') {
            setFilteredElectrodes(electrodes);
        } else {
            const filtered = electrodes.filter(electrode =>
                electrode.label.toLowerCase().startsWith(filterChar)
            );
            setFilteredElectrodes(filtered);
        }
    }, [electrodes, filterChar]);

    // Handle keydown events
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' || event.key === 'Backspace' || event.keyCode === 8 || event.key.toLowerCase() === filterChar) {
                setFilterChar('');
            } else if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                const char = event.key.toLowerCase();
                setFilterChar(char);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [filterChar]);


    /**
     * Handles saving designation data
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        try {
            // First save to database if we have a file ID
            if (state.fileId) {
                console.log('Saving designation with patientId:', {
                    fromState: state.patientId,
                    fromLocalizationData: localizationData?.patientId,
                    fileId: state.fileId
                });

                // Get user ID from session
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to save designations.');
                    return;
                }

                try {
                    // First save/update file metadata
                    const response = await fetch(`${backendURL}/api/save-designation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            designationData: electrodes,
                            localizationData: localizationData,
                            fileId: state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString(),
                            patientId: state.patientId
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('Failed to save designation:', result.error);
                        showError(`Failed to save designation: ${result.error}`);
                        return;
                    }

                    // Update the state with new modified date
                    setState(prevState => ({
                        ...prevState,
                        modifiedDate: new Date().toISOString()
                    }));

                    // Show success feedback
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds

                    console.log('Designation saved successfully');
                } catch (error) {
                    console.error('Error saving designation:', error);
                    showError(`Error saving designation: ${error.message}`);
                    return;
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, false);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of electrodes) {
                    for (let contact of electrode.contacts) {
                        console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
                    }
                }
            }
        } catch (error) {
            showError('Error saving data on database. Changes are not saved');
        }
    };

    /**
     * Handles exporting designation data
     * @async
     * @returns {Promise<void>}
     */
    const handleExport = async () => {
        try {
            // First save to database if we have a file ID
            if (state.fileId) {
                console.log('Saving designation to database...');

                // Get user ID from session
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to save designations.');
                    return;
                }

                try {
                    // First save/update file metadata
                    const response = await fetch(`${backendURL}/api/save-designation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            designationData: electrodes,
                            localizationData: localizationData,
                            fileId: state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString(),
                            patientId: state.patientId
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('Failed to save designation:', result.error);
                        showError(`Failed to save designation: ${result.error}`);
                        return;
                    }

                    // Update the state with new modified date
                    setState(prevState => ({
                        ...prevState,
                        modifiedDate: new Date().toISOString()
                    }));

                    // Show success feedback if this was a save operation
                        setShowSaveSuccess(true);

                    console.log('Designation saved successfully');
                } catch (error) {
                    console.error('Error saving designation:', error);
                    showError(`Error saving designation: ${error.message}`);
                    return;
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, true);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of electrodes) {
                    for (let contact of electrode.contacts) {
                        console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error exporting contacts:', error);
            showError(`Error exporting contacts: ${error.message}`);
        }
    };

    /**
     * Handles dispatching event to open resection tab
     * @async
     * @returns {Promise<void>}
     */
    const handleOpenResection = async () => {
        try {
            await handleSave();

            let designationData = {
                electrodes,
                originalData: localizationData
            };

            // Check for existing resection tabs
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab =>
                (tab.content === 'csv-resection' || tab.content === 'resection') &&
                tab.state?.patientId === state.patientId
            );

            if (existingTab) {
                // Compare the current resection data with the existing tab's data

                const currentDesignationData = structuredClone(designationData.electrodes);
                const existingDesignationData = structuredClone(existingTab.state.electrodes);

                // Remove surgeonmark from consideration
                currentDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.surgeonMark = false));
                existingDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.surgeonMark = false));

                // Check if the resection data has changed
                const hasResectionChanged = JSON.stringify(currentDesignationData) !== JSON.stringify(existingDesignationData);

                if (hasResectionChanged) {
                    // Close the existing tab
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);

                    // Create a new tab with updated data
                    const event = new CustomEvent('addResectionTab', {
                        detail: {
                            data: designationData,
                            patientId: state.patientId,
                            state: {
                                patientId: state.patientId,
                                fileId: state.fileId,
                                fileName: state.fileName,
                                creationDate: state.creationDate,
                                modifiedDate: new Date().toISOString()
                            }
                        }
                    });
                    window.dispatchEvent(event);
                } else {
                    // Just set the existing tab as active
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                }
            } else {
                // If the user never made resection page before with the patient
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to open stimulation.');
                    return;
                }

                const response = await fetch(`${backendURL}/api/by-patient/${state.patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to check for existing resection data');
                }

                const result = await response.json();

                // Create a new tab with the designation data
                const event = new CustomEvent('addResectionTab', {
                    detail: {
                        data: result.exists ? {
                            electrodes: result.data.designation_data,
                            originalData: result.data.localization_data
                        } : designationData,
                        patientId: state.patientId,
                        state: {
                            patientId: state.patientId,
                            fileId: result.exists ? result.fileId : state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString()
                        }
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error opening resection:', error);
            showError('Failed to open resection. Please try again.');
        }
    };

    return (
        <div className="flex-1 p-4 bg-gray-100 h-full lg:p-8">
            <div className="mb-3 lg:mb-6">
                <p className="text-sm text-gray-700 lg:text-lg">
                    Filtering electrodes by: {filterChar || 'None'} (Press a key to filter, Esc or Backspace to reset)
                </p>
            </div>
            {/* Contact tiles */}
            <ul className="space-y-3 lg:space-y-6">
                {filteredElectrodes.map((electrode) => (
                    <li
                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm
                                   lg:p-6"
                        key={electrode.label}
                    >
                        <p className="text-lg font-bold text-gray-800 mb-2
                                      lg:text-2xl lg:mb-4">
                            {electrode.label}
                        </p>
                        <ul className="flex flex-wrap gap-2
                                       lg:gap-4">
                            {electrode.contacts.map((contact) => (
                                <Contact
                                    key={contact.id}
                                    contact={contact}
                                    onClick={onClick}
                                />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>


            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1
                            lg:bottom-6 lg:right-6 lg:flex-row lg:gap-2">
                <div className="flex flex-row gap-1
                                lg:gap-2">
                    <div className="relative">
                        <button
                            className="grow py-1 px-2 bg-sky-600 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-sky-700 border border-sky-700 shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        {showSaveSuccess && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm whitespace-nowrap z-50">
                                Save successful!
                            </div>
                        )}
                    </div>
                    <button
                        className="grow py-1 px-2 bg-green-500 text-white font-semibold rounded border border-green-600 hover:bg-green-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleExport}
                    >
                        Export
                    </button>
                    <button
                        className="py-1 px-2 bg-purple-500 border border-purple-600 text-white font-semibold rounded hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleOpenResection}>
                        Open in Resection Page
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Contact component for displaying individual electrode contacts
 * @component
 * @param {Object} contact - Data for the contact
 * @param {Function} onClick - Handler to reflect the change on contact that was clicked
 * @returns {JSX.Element} A tile that shows information about the contact
 */
const Contact = ({ contact, onClick }) => {
    return (
        <li
            className={`w-[75px] p-2 rounded-lg shadow-sm cursor-pointer flex-shrink-0 transition-transform transform hover:scale-105 ${getMarkColor(contact)}
                        lg:w-[100px] lg:p-4`}
            onClick={() => onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    mark: (contact.mark + 1) % 4
                };
            })}
        >
            <p className="text-base font-bold text-gray-800 lg:text-xl">{contact.index}</p>
            <p className="text-xs font-medium text-gray-600 truncate lg:text-sm" title={contact.associatedLocation}>
                {contact.associatedLocation}
            </p>
        </li>
    );
};

/**
 * Gets CSS class for contact based on mark status
 * @param {Object} contact - Data for the contact
 * @returns {string} CSS classes for the contact
 */
function getMarkColor(contact) {
    let mark = "";
    switch (contact.mark) {
        case 0:
            mark = "bg-white ";
            break;
        case 1:
            mark = "bg-rose-300 ";
            break;
        case 2:
            mark = "bg-amber-300 ";
            break;
        case 3:
            mark = "bg-stone-300 ";
            break;
    }

    if (contact.surgeonMark) {
        mark += "border-2 border-stone-500";
    }
    else {
        mark += "border border-gray-300";
    }
    return mark;
}

export default Designation;
