import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";
import { saveDesignationCSVFile } from "../../utils/CSVParser";
import config from "../../../config.json" with { type: 'json' };

const PAGE_NAME = ["designation", "resection"];

const backendURL = config.backendURL;

const ContactDesignation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showLegend, setShowLegend] = useState(false);

    const [layout, setLayout] = useState(() => {
        // First check savedState for layout
        if (savedState && savedState.layout) {
            return savedState.layout;
        }
        // Default to designation view
        return PAGE_NAME[0];
    });

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
            layout: layout,
            localizationData: localizationData
        };
        setState(newState);
    }, [modifiedElectrodes, layout, localizationData]);

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

    const toggleLayout = () => {
        const newLayout = layout === PAGE_NAME[0] ? PAGE_NAME[1] : PAGE_NAME[0];
        setLayout(newLayout);
    };

    const createStimulationTab = () => {
        if (Object.keys(modifiedElectrodes).length === 0) return;

        // Get designation data from the current localization
        try {
            exportContacts(modifiedElectrodes, false);
        } catch (error) {
            alert('Error saving data on database. Changes are not saved');
        }

        let stimulationData = modifiedElectrodes.map(electrode => ({
            ...electrode,
            contacts: electrode.contacts.map((contact, index) => {
                let pair = index;
                if (index == 0) pair = 2;
                return {
                    ...contact,
                    pair: pair,
                    isPlanning: false,
                    duration: 3.0, // TODO : ask what default value should be
                    frequency: 105.225,
                    current: 2.445,
                }
            }),
        }));
        // Create a new tab with the designation data
        const event = new CustomEvent('addStimulationTab', {
            detail: { data: stimulationData }
        });
        window.dispatchEvent(event);
    };

    const exportContacts = async (electrodes, download = true) => {
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
                            designationData: electrodes,
                            localizationData: localizationData,
                            fileId: state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString()
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
                    if (!download) {
                        setShowSaveSuccess(true);
                        setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
                    }
                    
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
                saveDesignationCSVFile(electrodes, localizationData, download);
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
            alert(`Error exporting contacts: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col h-auto p-4 ">
            {/* Floating Toggle Switch at the Top Right */}
            <button
                onClick={toggleLayout}
                className="fixed top-12 right-6 z-50 w-50 h-10 rounded-full transition-colors duration-300 focus:outline-none flex items-center bg-gray-400 shadow-lg transition-colors duration-200 cursor-pointer hover:bg-gray-300"
            >
                <span
                    className={`absolute left-1 top-1 w-24 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        layout === PAGE_NAME[0] ? "translate-x-0" : "translate-x-24"
                    }`}
                ></span>
                <span
                    className={`absolute left-2.5 text-sm font-semibold ${
                        layout === PAGE_NAME[0] ? "text-blue-500" : "text-gray-500"
                    }`}
                >
                    {PAGE_NAME[0]}
                </span>
                <span
                    className={`absolute right-4.5 text-sm font-semibold ${
                        layout === PAGE_NAME[1] ? "text-blue-500" : "text-gray-500"
                    }`}
                >
                    {PAGE_NAME[1]}
                </span>
            </button>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto">
                {layout === PAGE_NAME[0] ? (
                    <Designation electrodes={modifiedElectrodes} onClick={updateContact} />
                ) : (
                    <Resection electrodes={modifiedElectrodes} onClick={updateContact} onStateChange={setState} savedState={state} />
                )}
            </div>

            {/* Floating Help Button and Guide at the Bottom Left */}
            <div className="fixed bottom-2 left-2 z-50
                            lg:bottom-6 lg:left-6">
                {showLegend ? (
                    <Legend layout={layout} page_names={PAGE_NAME} setShowLegend={setShowLegend} />
                ) : (
                    <button
                        className="py-1 px-3 border border-sky-800 bg-sky-600 text-white text-sm font-bold rounded-full transition-colors duration-200 cursor-pointer hover:bg-sky-800
                                   lg:py-2 lg:px-4 lg:text-base"
                        onClick={() => setShowLegend(true)}>
                        ?
                    </button>
                )}
            </div>

            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1
                            lg:bottom-6 lg:right-6 lg:flex-row lg:gap-2">
                <button
                    className="py-1 px-2 bg-sky-600 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-blue-800 border border-sky-800 shadow-lg
                               lg:py-2 lg:px-4 lg:text-base"
                    onClick={createStimulationTab}
                >
                    Open in Stimulation Plan
                </button>
                <div className="relative">
                    <button
                        className="py-1 px-2 bg-green-500 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-green-700 border border-green-700 shadow-lg
                                   lg:py-2 lg:px-4 lg:text-base"
                        onClick={() => exportContacts(modifiedElectrodes, false)}
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
                    className="py-1 px-2 bg-sky-600 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-sky-800 border border-sky-800 shadow-lg
                               lg:py-2 lg:px-4 lg:text-base"
                    onClick={() => exportContacts(modifiedElectrodes)}
                >
                    Export
                </button>
            </div>
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
const Legend = ({ layout = "designation", page_names, setShowLegend }) => {
    return (
        <div className="max-w-48 shadow-lg border border-gray-400 rounded bg-gray-50 p-1
                        lg:max-w-72 lg:p-2">
            {layout === page_names[0] ? (
                <>
                    <div className="text-center font-bold text-wrap
                                    lg:text-xl">
                        Epileptic Network Labeling Page Help
                    </div>
                    <div className="text-xs lg:text-base text-wrap">
                        Click on a contact to label and change its color.
                    </div>

                    {/* Legend */}
                    <div className="my-2 mx-2 lg:mx-5">
                        <div className="text-center font-semibold text-sm
                                        lg:text-lg">
                            Legend
                        </div>
                        <div>
                            <LegendItem color="rose" itemName="SOZ - Seizure Onset Zone" />
                            <LegendItem color="amber" itemName="EN - Epileptic Network" />
                            <LegendItem color="stone" itemName="NI - Not Involved" />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="text-center font-semibold
                                    lg:text-xl">
                        Resection Page Help
                    </div>
                </>
            )}
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
const LegendItem = ({ color = "black", itemName }) => {
    const colorVariants = {
        amber: "text-amber-300",
        rose: "text-rose-300",
        stone: "text-stone-300",
        black: "text-black"
    }

    return (
        <div className="flex">
            <div className={`${colorVariants[color]} drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] justify-self-start text-xs
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
