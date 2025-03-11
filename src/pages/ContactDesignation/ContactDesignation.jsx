import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";

const PAGE_NAME = ["designation", "resection"];

const ContactDesignation = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [layout, setLayout] = useState(() => {
        if (Object.keys(savedState).length === 0) {
            // TODO Potentially determine from user account status?
            return "designation";
        }
        return savedState.layout;
    });

    const [modifiedElectrodes, setModifiedElectrodes] = useState(() => {
        if (Object.keys(savedState).length !== 0) {
            return savedState.electrodes;
        }

        if (Object.keys(initialData).length !== 0) {
            // TODO Parse initialData.data using parseDesignation from parseCSV
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

        // return [];
    });

    useEffect(() => {
        onStateChange({
            electrodes: modifiedElectrodes,
            layout: layout
        });
    }, [modifiedElectrodes, layout]);


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
                    <Resection electrodes={modifiedElectrodes} onClick={updateContact} />
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

function exportContacts(electrodes) {
    for (let electrode of electrodes) {
        for (let contact of electrode.contacts) {
            console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
        }
    }
}

export default ContactDesignation;
