import { demoContactData } from "./StimulationPlanning/demoData";
import { useState } from "react";

const ContactDesignation = ({ electrodes = demoContactData }) => {
    // Add id and such so that it can be used after making pair
    electrodes.map((electrode) => {
        electrode.contacts.map((contact, index) => {
            const contactId = `${electrode.label}${index}`;
            contact.id = contactId;
            contact.electrodeLabel = electrode.label;
            contact.index = index;
        })
    });

    return (
        <div className="flex h-screen p-6 space-x-6">
            <ContactList electrodes={electrodes} />
            <button className="absolute right-10 bottom-10 py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700"
                    onClick={() => exportContacts(electrodes)}>
                export
            </button>
        </div>
    );
};

// Generate list of contacts from list of electrodes
const ContactList = ({ electrodes }) => {
    return (
        <div className="flex-1">
            <ul className="space-y-4">
                {electrodes.map((electrode) => ( // Vertical list for every electrode
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
                            {electrode.contacts.map((contact, index) => { // Horizontal list for every contact
                                return (
                                    <Contact key={contact.id}
                                            contact={contact} />
                                );
                            })} {/* contact */}
                        </ul>
                    </li>
                ))} {/* electrode */}
            </ul>
        </div>
    );
};

// Draggable contact in contact list
const Contact = ({ contact }) => {
    return (
        <li className="min-w-[100px] p-4 border rounded-lg shadow cursor-pointer opacity-100"
            onClick={() => mark(contact)} >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
        </li>
    );
};

function mark(contact) {
    console.log("marking " + contact.id);
}

function exportContacts(electrodes) {
    for (let electrode of electrodes) {
        for (let contact of electrode.contacts) {
            console.log(contact.id); // Simply put in console for now...
        }
    }
}

export default ContactDesignation;
