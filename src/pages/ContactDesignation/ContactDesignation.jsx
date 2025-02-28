import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Assuming you're using React Router
import Resection from "./ResectionPage";
import Designation from "./DesignationPage";

const PAGE_NAME = ["designation", "resection"]

const ContactDesignation = ({ electrodes = demoContactData }) => {
    // Use URL search parameters to control the layout
    const [searchParams, setSearchParams] = useSearchParams();

    // Get the layout from the URL parameter, default to first item
    const layout = searchParams.get("style") || PAGE_NAME[0];

    // Load state from localStorage or initialize with demo data
    const [modifiedElectrodes, setModifiedElectrodes] = useState(() => {
        const savedState = localStorage.getItem("electrodesState");
        return savedState
            ? JSON.parse(savedState) // Restore saved state
            : electrodes.map(electrode => ({
                  ...electrode,
                  contacts: electrode.contacts.map((contact, index) => ({
                      ...contact,
                      id: `${electrode.label}${index}`,
                      electrodeLabel: electrode.label,
                      index: index,
                      mark: contact.mark || 0, // Initialize mark if not present
                      surgeonMark: contact.surgeonMark || false,
                  })),
              }));
    });

    // Save state to localStorage whenever modifiedElectrodes changes
    useEffect(() => {
        localStorage.setItem("electrodesState", JSON.stringify(modifiedElectrodes));
    }, [modifiedElectrodes]);

    // Function to update a contact's element
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

    // Toggle between layouts and update the URL
    const toggleLayout = () => {
        const newLayout = layout === PAGE_NAME[0] ? PAGE_NAME[1] : PAGE_NAME[0];
        setSearchParams({ style: newLayout }); // Update the URL parameter
    };

    return (
        <div className="flex flex-col h-screen p-6 space-y-6">
            {/* Toggle Switch at the Top Center */}
            <div className="flex justify-center">
                <button
                    onClick={toggleLayout}
                    className="relative w-50 h-10 rounded-full transition-colors duration-300 focus:outline-none flex items-center bg-gray-400"
                >
                    {/* Sliding circle */}
                    <span
                        className={`absolute left-1 top-1 w-24 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                            layout === PAGE_NAME[0] ? "translate-x-0" : "translate-x-24"
                        }`}
                    ></span>
                    {/* Text inside the toggle switch */}
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
            </div>

            {/* Render the appropriate layout based on the URL parameter */}
            {layout === PAGE_NAME[0] ? (
                <Designation electrodes={modifiedElectrodes} onClick={updateContact} />
            ) : (
                <Resection electrodes={modifiedElectrodes} onClick={updateContact} />
            )}

            <button
                className="absolute right-10 bottom-10 py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700"
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
