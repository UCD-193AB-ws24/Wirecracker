import React, { useState, useEffect } from 'react';
import { saveDesignationCSVFile } from "../../utils/CSVParser";
import { useError } from '../../context/ErrorContext';
import { useWarning } from '../../context/WarningContext';

const backendURL = __APP_CONFIG__.backendURL;

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
    const { showWarning } = useWarning();
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    /**
     * Store original localization for saving / exporting later
     */
    const [localizationData, setLocalizationData] = useState(() => {
        if (savedState && savedState.localizationData) {
            return structuredClone(savedState.localizationData);
        }
        return initialData?.originalData ? structuredClone(initialData.originalData) : null;
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
                    showError('User not authenticated. Please log in to save epilepsy.');
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
                        showError(`Failed to save epilepsy: ${result.error}`);
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
                        showError(`Error saving epilepsy: ${error.message}`);
                    }
                    return;
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, state.patientId, state.creationDate, state.modifiedDate, false, 'designation', state.fileId);
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
                    showError('User not authenticated. Please log in to save epilepsy.');
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
                        showError(`Failed to save epilepsy: ${result.error}`);
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
                        showError(`Error saving epilepsy: ${error.message}`);
                        return;
                    }
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, state.patientId, state.creationDate, state.modifiedDate, true, 'designation', state.fileId);
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
                showError(`Error saving epilepsy: ${error.message}`);
                return;
            }
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

            // Check for existing designation tabs
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab =>
                (tab.content === 'resection') &&
                tab.state?.patientId === state.patientId
            );

            if (existingTab) {
                // Compare the current designation data with the existing tab's data
                const currentDesignationData = structuredClone(designationData.electrodes);
                const existingDesignationData = structuredClone(existingTab.state.electrodes);

                // Remove surgeonmark from consideration
                currentDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.mark = 0));
                existingDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.mark = 0));

                const hasDesignationChanged = JSON.stringify(currentDesignationData) !== JSON.stringify(existingDesignationData);

                if (hasDesignationChanged) {
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
                                fileId: existingTab.state?.fileId || null,
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
                    showError('User not authenticated. Please log in to open epilepsy.');
                    return;
                }

                const response = await fetch(`${backendURL}/api/by-patient/${state.patientId}?type=resection`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to check for existing neurosurgery data');
                }

                const result = await response.json();

                // Create a new tab with the neurosurgery data
                const event = new CustomEvent('addResectionTab', {
                    detail: {
                        data: result.exists ? {
                            electrodes: result.data.designation_data,
                            originalData: result.data.localization_data
                        } : designationData,
                        patientId: state.patientId,
                        state: {
                            patientId: state.patientId,
                            fileId: result.exists ? result.fileId : null,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString()
                        }
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database.");
            } else {
                console.error('Error saving epilepsy:', error);
                showError(`Error saving epilepsy: ${error.message}`);
                return;
            }
        }
    };

    const handleShareWithNeurosurgeon = async () => {
        if (!shareEmail) {
            showError('Please enter an email address');
            return;
        }

        setIsSharing(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Starting share process...');
            console.log('Current state:', {
                fileId: state.fileId,
                patientId: state.patientId,
                electrodes
            });

            // First save the neurosurgery file
            console.log('Saving epilepsy file...');
            await handleSave();
            console.log('Epilepsy file saved successfully');

            // Now share the file
            console.log('Sharing file with neurosurgeon...');
            const response = await fetch(`${backendURL}/api/files/share-with-neurosurgeon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileId: state.fileId,
                    email: shareEmail,
                    designationData: electrodes,
                    localizationData: localizationData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Failed to share file:', error);
                throw new Error(error.error || 'Failed to share file');
            }

            const result = await response.json();
            console.log('File shared successfully:', result);
            showWarning('File shared successfully with neurosurgeon');
            setShowShareModal(false);
            setShareEmail('');
        } catch (error) {
            console.error('Error sharing file:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            showError(error.message);
        } finally {
            setIsSharing(false);
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
                <div className="flex flex-col gap-1 lg:flex-row lg:gap-2">
                    <button
                        className="grow py-1 px-2 bg-green-500 text-white font-semibold rounded border border-green-600 hover:bg-green-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    {showSaveSuccess && (
                        <div className="text-green-600 text-sm">
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
                    className="py-1 px-2 bg-blue-500 border border-blue-600 text-white font-semibold rounded hover:bg-blue-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                lg:py-2 lg:px-4 lg:text-base"
                    onClick={() => setShowShareModal(true)}>
                    Share with Neurosurgeon
                </button>
                <button
                        className="py-1 px-2 bg-purple-500 border border-purple-600 text-white font-semibold rounded hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                    onClick={handleOpenResection}>
                    Open in Neurosurgery
                </button>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Share with Neurosurgeon</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Neurosurgeon's Email
                            </label>
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Enter email address"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowShareModal(false);
                                    setShareEmail('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                disabled={isSharing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareWithNeurosurgeon}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                disabled={isSharing}
                            >
                                {isSharing ? 'Sharing...' : 'Share'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
