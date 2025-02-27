import { demoContactData } from "./demoData";
import { useState, useEffect } from "react";

const ContactDesignation = ({ electrodes = demoContactData }) => {
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

    const handleMarkContact = (contactId) => {
        setModifiedElectrodes(prevElectrodes => {
            return prevElectrodes.map(electrode => ({
                ...electrode,
                contacts: electrode.contacts.map(contact => {
                    if (contact.id === contactId) {
                        return {
                            ...contact,
                            mark: (contact.mark + 1) % 3
                        };
                    }
                    return contact;
                }),
            }));
        });
    };

    return (
        <div className="flex h-screen p-6 space-x-6">
            <ContactList electrodes={modifiedElectrodes} onMark={handleMarkContact} />
            <button
                className="absolute right-10 bottom-10 py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700"
                onClick={() => exportContacts(modifiedElectrodes)}
            >
                export
            </button>
        </div>
    );
};

const ContactList = ({ electrodes, onMark }) => {
    return (
        <div className="flex-1">
            <ul className="space-y-4">
                {electrodes.map((electrode) => (
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
                            {electrode.contacts.map((contact) => (
                                <Contact
                                    key={contact.id}
                                    contact={contact}
                                    onMark={onMark}
                                />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Contact = ({ contact, onMark }) => {
    return (
        <li
            className={`min-w-[100px] p-4 border rounded-lg shadow cursor-pointer opacity-100 ${getMarkColor(contact)}`}
            onClick={() => onMark(contact.id)}
        >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
        </li>
    );
};

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
    }

    if (contact.surgeonMark) mark += "border-3";
    return mark;
}

function exportContacts(electrodes) {
    for (let electrode of electrodes) {
        for (let contact of electrode.contacts) {
            console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
        }
    }
}

export default ContactDesignation;
