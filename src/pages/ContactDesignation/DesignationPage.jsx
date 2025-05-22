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
        return initialData?.data.originalData ? JSON.parse(JSON.stringify(initialData.data.originalData)) : null;
    });

    /**
    * Store electrodes data
    */
    const [electrodes, setElectrodes] = useState(() => {
        if (savedState && savedState.electrodes) {
            return savedState.electrodes;
        }

        if (initialData && initialData.data.electrodes) {
            return initialData.data.electrodes;
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

    // Update electrodes if there are any update from resection tab stored in the channel
    useEffect(() => {
        const channel = JSON.parse(localStorage.getItem("Designation_Resection_Sync_Channel"));
        if (channel[state.patientId]) {
            setElectrodes(channel[state.patientId]);
            handleSave();
        }

        delete channel[state.patientId];
        localStorage.setItem("Designation_Resection_Sync_Channel", JSON.stringify(channel));
    }, []);

    /**
     * Handles contact click event
     * @param {string} contactId - ID of the clicked contact
     * @param {Function} change - Function to modify contact state
     */
    const onClick = (contactId, change) => {
        let updatedElectrode = electrodes.map(electrode => ({
            ...electrode,
            contacts: electrode.contacts.map(contact => {
                if (contact.id === contactId) {
                    return change(contact);
                }
                return contact;
            }),
        }));

        setElectrodes(updatedElectrode);

        // Set the updated electrode in designated "channel" in localstorage
        const prevChannel = JSON.parse(localStorage.getItem("Designation_Resection_Sync_Channel"));
        localStorage.setItem("Designation_Resection_Sync_Channel", JSON.stringify({
            ...prevChannel,
            [state.patientId]: updatedElectrode
        }))
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

                    // Only update the state with new modified date if the save was successful
                    // and we got a new modified date back
                    if (result.modifiedDate) {
                        setState(prevState => ({
                            ...prevState,
                            modifiedDate: result.modifiedDate
                        }));
                    }

                    // Show success feedback
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds

                    console.log('Designation saved successfully');
                } catch (error) {
                    if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                        showWarning("No internet connection. The progress is not saved. Make sure to download your progress.");
                    } else {
                        console.error('Error saving designation:', error);
                        showError(`Error saving designation: ${error.message}`);
                    }
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
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved. Make sure to download your progress.");
            } else {
                showError('Error saving data on database. Changes are not saved');
            }
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

                    // Only update the state with new modified date if the save was successful
                    // and we got a new modified date back
                    if (result.modifiedDate) {
                        setState(prevState => ({
                            ...prevState,
                            modifiedDate: result.modifiedDate
                        }));
                    }

                    // Show success feedback if this was a save operation
                    setShowSaveSuccess(true);

                    console.log('Designation saved successfully');
                } catch (error) {
                    if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                        showWarning("No internet connection. The progress is not saved on the database.");
                    } else {
                        console.error('Error saving designation:', error);
                        showError(`Error saving designation: ${error.message}`);
                        return;
                    }
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
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database.");
            } else {
                console.error('Error saving designation:', error);
                showError(`Error saving designation: ${error.message}`);
                return;
            }
        }
    };

    /**
     * Handles dispatching event to open stimulation tab
     * @async
     */
    const handleOpenStimulation = async () => {
        try {
            let stimulationData = electrodes.map(electrode => ({
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
                    patientId: state.patientId,
                    state: {
                        patientId: state.patientId,
                        fileId: state.fileId,
                        fileName: state.fileName,
                        creationDate: state.creationDate,
                        modifiedDate: new Date().toISOString(),
                        designationModifiedDate: state.modifiedDate,
                        fromDesignation: true
                    }
                }
            });
            window.dispatchEvent(event);

            await handleSave();
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error opening stimulation:', error);
                showError('Failed to open stimulation. Please try again.');
            }
        }
    };

    /**
     * Handles opening the test selection page
     * @async
     */
    const handleOpenTestSelection = async () => {
        try {
            await handleSave();

            // First check if any test selection tabs for this patient already exist
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab => 
                tab.content === 'functional-test' && 
                tab.state?.patientId === state.patientId
            );

            if (existingTab) {
                // Compare modified dates
                const existingModifiedDate = new Date(existingTab.state.modifiedDate);
                const designationModifiedDate = new Date(state.modifiedDate);

                if (existingModifiedDate > designationModifiedDate) {
                    // Switch to existing tab as it's newer
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                    return;
                } else {
                    // Close existing tab as it's older
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);
                }
            } else {
                // Check database for existing file
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('User not authenticated');
                    }

                    const response = await fetch(`${backendURL}/api/by-patient-test/${state.patientId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        }
                    });

                    const result = await response.json();
                    
                    if (result.success && result.exists) {
                        const dbModifiedDate = new Date(result.data.modified_date);
                        const designationModifiedDate = new Date(state.modifiedDate);

                        if (dbModifiedDate > designationModifiedDate) {
                            // Create tab from database file
                            const event = new CustomEvent('addFunctionalTestTab', {
                                detail: {
                                    data: result.data.test_selection_data,
                                    state: {
                                        ...result.data,
                                        fileName: 'Test Selection',
                                        fileId: result.fileId,
                                        patientId: state.patientId
                                    }
                                }
                            });
                            window.dispatchEvent(event);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking database for existing file:', error);
                    // Continue with creating new tab if database check fails
                }
            }

            // Create a new tab with the test selection data
            const event = new CustomEvent('addFunctionalTestTab', {
                detail: { 
                    data: electrodes,
                    state: {
                        patientId: state.patientId,
                        fileId: state.fileId,
                        fileName: 'Test Selection',
                        creationDate: state.creationDate,
                        modifiedDate: new Date().toISOString()
                    }
                }
            });
            window.dispatchEvent(event);

        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error opening test selection:', error);
                showError('Failed to open test selection. Please try again.');
            }
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
                        onClick={handleOpenStimulation}>
                        Open in Stimulation Page
                    </button>
                    <button
                        className="py-1 px-2 bg-indigo-500 border border-indigo-600 text-white font-semibold rounded hover:bg-indigo-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleOpenTestSelection}>
                        Open in Test Selection
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
