import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";
import { saveDesignationCSVFile } from "../../utils/CSVParser";

const PAGE_NAME = ["designation", "resection"];

const ContactDesignation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [state, setState] = useState(savedState);

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
        console.log("Updated savedState:", state); // Debugging
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

    const exportContacts = async (electrodes) => {
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
                    const response = await fetch('http://localhost:5000/api/save-designation', {
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
            alert(`Error exporting contacts: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 ">
            {/* Floating Toggle Switch at the Top Right */}
            <button
                onClick={toggleLayout}
                className="fixed top-6 right-6 z-50 w-50 h-10 rounded-full transition-colors duration-300 focus:outline-none flex items-center bg-gray-400 shadow-lg hover:bg-gray-300"
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

            {/* Floating Export Button at the Bottom Right */}
            <button
                className="fixed bottom-6 right-6 z-50 py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700 shadow-lg"
                onClick={() => exportContacts(modifiedElectrodes)}
            >
                Export
            </button>
        </div>
    );
};

export default ContactDesignation;
