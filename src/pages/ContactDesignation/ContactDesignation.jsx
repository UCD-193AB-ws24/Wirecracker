import { useState, useEffect } from "react";
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";
import { saveDesignationCSVFile } from "../../utils/CSVParser";
import { useError } from '../../context/ErrorContext';
import { useWarning } from '../../context/WarningContext.jsx';
import HelpButton from "../../utils/HelpButton.jsx";

const backendURL = __APP_CONFIG__.backendURL;

const ContactDesignation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const { showError } = useError();
    const { showWarning } = useWarning();
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('designation');
    const [showLegend, setShowLegend] = useState(false);

    // Store the original localization data if it exists
    const [localizationData, setLocalizationData] = useState(() => {
        if (savedState && savedState.localizationData) {
            return JSON.parse(JSON.stringify(savedState.localizationData));
        }
        return initialData?.originalData ? JSON.parse(JSON.stringify(initialData.originalData)) : null;
    });

    const [modifiedElectrodes, setModifiedElectrodes] = useState(() => {
        if (savedState && savedState.electrodes) {
            return JSON.parse(JSON.stringify(savedState.electrodes));
        }

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

    // Save state changes
    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        const newState = {
            ...state,
            electrodes: modifiedElectrodes,
            localizationData: localizationData
        };
        setState(newState);
    }, [modifiedElectrodes, localizationData]);

    const updateContact = (contactId, change) => {
        setModifiedElectrodes(prevElectrodes => {
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
                            designationData: modifiedElectrodes,
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
                saveDesignationCSVFile(modifiedElectrodes, localizationData, false);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of modifiedElectrodes) {
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
                            designationData: modifiedElectrodes,
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
                        throw result.error;
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
                saveDesignationCSVFile(modifiedElectrodes, localizationData, true);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of modifiedElectrodes) {
                    for (let contact of electrode.contacts) {
                        console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
                    }
                }
            }
        } catch (error) {
            // Somehow got here? Well lets just download it anyways
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database.");
                saveDesignationCSVFile(modifiedElectrodes, localizationData, true);
            } else {
                console.error('Error exporting contacts:', error);
                showError(`Error exporting contacts: ${error.message}`);
            }
        }
    };

    const handleOpenStimulation = async () => {
        try {
            let stimulationData = modifiedElectrodes.map(electrode => ({
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
                        designationModifiedDate: state.modifiedDate
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

    return (
        <div className="flex flex-col h-9/10 p-2 lg:p-4">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-2
                            lg:space-x-4 lg:mb-4">
            <button
                    onClick={() => setActiveTab('designation')}
                    className={`px-2 py-1 font-bold text-sm rounded-lg transition-colors duration-200
                                lg:px-4 lg:py-2 lg:text-base ${
                        activeTab === 'designation'
                            ? 'bg-sky-600 text-white'
                            : 'bg-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-300 cursor-pointer'
                    }`}
                >
                    Labeling
                </button>
                <button
                    onClick={() => setActiveTab('resection')}
                    className={`px-2 py-1 font-bold text-sm rounded-lg transition-colors duration-200
                                lg:px-4 lg:py-2 lg:text-base ${
                        activeTab === 'resection'
                            ? 'bg-sky-600 text-white'
                            : 'bg-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-300 cursor-pointer'
                    }`}
                >
                    Resection
            </button>
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'designation' ? (
                    <Designation 
                        electrodes={modifiedElectrodes} 
                        onClick={updateContact}
                        onStateChange={setState}
                        savedState={state}
                    />
                ) : (
                    <Resection 
                        electrodes={modifiedElectrodes} 
                        onClick={updateContact} 
                        onStateChange={setState} 
                        savedState={state} 
                    />
                )}
            </div>

            {/* Floating Help Button and Guide at the Bottom Left */}
            {activeTab === "designation" ? (
                <HelpButton
                    title="Epileptic Network Labeling Page Help"
                    instructions="Click on a contact to label and change its color."
                />
            ) : (
                <HelpButton
                    title="Resection Page Help"
                    instructions="(Optional) Upload brain scan and contact coordinates. Click contact in brain scan or list to mark for surgery."
                />
            )}

            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1
                            lg:bottom-6 lg:right-6 lg:flex-row lg:gap-2">
                {activeTab === 'resection' && (
                    <button
                        className="py-1 px-2 bg-purple-500 border border-purple-600 text-white font-semibold rounded hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleOpenStimulation}>
                        Open in Stimulation Plan
                    </button>
                )}

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
                </div>
            </div>
        </div>
    );
};

export default ContactDesignation;
