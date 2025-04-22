import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";
import { saveDesignationCSVFile } from "../../utils/CSVParser";
import config from "../../../config.json" with { type: 'json' };

const backendURL = config.backendURL;

const ContactDesignation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('designation');

    // Store the original localization data if it exists
    const [localizationData, setLocalizationData] = useState(() => {
        if (savedState && savedState.localizationData) {
            return savedState.localizationData;
        }
        return initialData?.originalData || null;
    });

    const [modifiedElectrodes, setModifiedElectrodes] = useState(() => {
        if (savedState && savedState.electrodes) {
            return savedState.electrodes;
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

        // For demo purpose
        return demoContactData.map(electrode => ({
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
                    alert('User not authenticated. Please log in to save designations.');
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
                        alert(`Failed to save designation: ${result.error}`);
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
                    alert(`Error saving designation: ${error.message}`);
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
            console.error('Error exporting contacts:', error);
            alert(`Error exporting contacts: ${error.message}`);
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
                    alert('User not authenticated. Please log in to save designations.');
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
                        alert(`Failed to save designation: ${result.error}`);
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
                    alert(`Error saving designation: ${error.message}`);
                    return;
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
            console.error('Error exporting contacts:', error);
            alert(`Error exporting contacts: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col h-screen p-4">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-4">
            <button
                    onClick={() => setActiveTab('designation')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        activeTab === 'designation'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Designation
                </button>
                <button
                    onClick={() => setActiveTab('resection')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        activeTab === 'resection'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                <button
                    className="py-2 px-4 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-lg"
                    onClick={handleSave}
                >
                    Save
                </button>
                <button
                    className="py-2 px-4 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors duration-200 shadow-lg"
                    onClick={handleExport}
                >
                    Export
                </button>
                {activeTab === 'resection' && (
                    <button
                        className="py-2 px-4 bg-purple-500 text-white font-bold rounded-md hover:bg-purple-600 transition-colors duration-200 shadow-lg"
                        onClick={() => {
                            // Navigate to stimulation plan
                            const event = new CustomEvent('addStimulationTab', {
                                detail: { data: modifiedElectrodes }
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        Open in Stimulation Plan
                    </button>
                )}
            </div>

            {/* Save Success Modal */}
            {showSaveSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Success</h2>
                        <p className="mb-4">Designation data saved successfully!</p>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => setShowSaveSuccess(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactDesignation;
