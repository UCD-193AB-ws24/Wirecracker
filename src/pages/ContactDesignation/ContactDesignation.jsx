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
    const [showLegend, setShowLegend] = useState(false);

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
            <div className="fixed bottom-2 left-2 z-50
                            lg:bottom-6 lg:left-6">
                {showLegend ? (
                    <Legend layout={activeTab} setShowLegend={setShowLegend} />
                ) : (
                    <button
                        className="size-8 border border-sky-800 bg-sky-600 text-white text-sm text-center font-bold rounded-full transition-colors duration-200 cursor-pointer hover:bg-sky-800
                                   lg:size-11 lg:text-base"
                        onClick={() => setShowLegend(true)}>
                        ?
                    </button>
                )}
            </div>

            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1
                            lg:bottom-6 lg:right-6 lg:flex-row lg:gap-2">
                {activeTab === 'resection' && (
                    <button
                        className="py-1 px-2 bg-purple-500 border border-purple-600 text-white font-semibold rounded hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={() => {
                            // Navigate to stimulation plan
                            const event = new CustomEvent('addStimulationTab', {
                                detail: { 
                                    data: modifiedElectrodes,
                                    patientId: state.patientId,
                                    state: {
                                        patientId: state.patientId
                                    },
                                    originalData: {
                                        patientId: state.patientId
                                    }
                                }
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        Open in Stimulation Plan
                    </button>
                )}

                <div className="flex flex-row gap-1
                                lg:gap-2">
                    <button
                        className="grow py-1 px-2 bg-sky-600 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-sky-700 border border-sky-700 shadow-lg
                                lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="grow py-1 px-2 bg-green-500 text-white font-semibold rounded border border-green-600 hover:bg-green-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleExport}
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* Save Success Modal */}
            {showSaveSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-3 lg:p-6 rounded-lg shadow-xl">
                        <h2 className="text-base lg:text-xl font-bold mb-2 lg:mb-4">Success</h2>
                        <p className="mb-2 lg:mb-4">Designation data saved successfully!</p>
                        <button
                            className="px-2 py-1 bg-sky-600 border border-sky-700 text-white rounded hover:bg-sky-700
                                       lg:px-4 lg:py-2"
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

/**
 * 
 * @param {string} layout
 * @param {string[]} page_names
 * @param setShowLegend
 * @returns 
 */
const Legend = ({ layout = "designation", setShowLegend }) => {
    return (
        <div className="max-w-48 shadow-lg border border-gray-400 rounded bg-gray-50 p-1
                        lg:max-w-72 lg:p-2">
            {layout === "designation" ? (
                <>
                    <div className="text-center font-bold text-wrap
                                    lg:text-xl">
                        Epileptic Network Labeling Page Help
                    </div>
                    <div className="text-xs lg:text-base text-wrap">
                        Click on a contact to label and change its color.
                    </div>
                </>
            ) : (
                <>
                    <div className="text-center font-semibold
                                    lg:text-xl">
                        Resection Page Help
                    </div>
                    <div className="text-xs lg:text-base text-wrap">
                        <span className="text-fuchsia-700">
                            (Optional)
                        </span>
                        &nbsp;Upload brain scan and contact coordinates.
                    </div>
                    <div className="text-xs lg:text-base text-wrap">
                        Click contact in brain scan or list to mark for surgery.
                    </div>
                </>
            )}

            {/* Legend */}
            <div className="my-2 mx-2 lg:mx-5">
                <div className="text-center font-semibold text-sm
                                lg:text-lg">
                    Legend
                </div>
                <div>
                    <LegendItem color="rose" itemName="SOZ - Seizure Onset Zone" />
                    <LegendItem color="amber" itemName="EN - Epileptic Network" />
                    <LegendItem color="stone" itemName="OOB - Out of Brain" />
                    <LegendItem color="white" itemName="NI - Not Involved" />
                    <LegendItem color="white" outline="true" itemName="Marked for surgery" />
                </div>
            </div>

            <button
                className="py-2 px-4 border border-sky-800 bg-sky-600 text-white font-semibold rounded cursor-pointer transition-colors duration-200 hover:bg-sky-800"
                onClick={() => setShowLegend(false)}>
                Close
            </button>
        </div>
    );
}

/**
 * 
 * @param {string} color
 * @param {string} itemName
 * @returns 
 */
const LegendItem = ({ color = "black", outline = "false", itemName }) => {
    const colorVariants = {
        amber: "text-amber-300",
        rose: "text-rose-300",
        stone: "text-stone-300",
        white: "text-white",
        black: "text-black"
    }
    const bolding = {
        true: "font-stone-outline-2",
        false: "font-gray-outline"
    }

    return (
        <div className="flex">
            <div className={`${colorVariants[color]} ${bolding[outline]} justify-self-start text-xs
                            lg:text-base`}>
                &#x25A0;
            </div>
            <div className="flex-1 justify-self-end text-right text-xs
                            lg:text-base">
                {itemName}
            </div>
        </div>
    );
}

export default ContactDesignation;
