import { demoContactData } from "./demoData";
import React, { useState, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';

const ContactSelection = ({ electrodes = demoContactData }) => {
    const [planningContacts, setPlanningContacts] = useState([]);   // TODO Connect planningContacts to backend to save the state
    const [areAllVisible, setAreAllVisible] = useState(false);      // Boolean for if all contacts are visible

    // Function to handle "drop" on planning pane. Takes contact and index, and insert the contact
    // at the index or at the end if index is not specified. If the contact exist already, this function
    // will change the contact's location to index passed (or to the end)
    const handleDropToPlanning = (contact, index = "") => {
        setPlanningContacts((prev) => {
            if (index === "") index = prev.length;
            if (index > prev.length) index = prev.length;
            const newContacts = [...prev];

            if (prev.some((c) => c.id === contact.id)) {
                // Move existing one
                let oldIndex = prev.indexOf(contact);
                if (index === oldIndex + 1) return prev; // Ignore if index is one below
                newContacts.splice(index, 0, newContacts.splice(oldIndex, 1)[0]);
            } else {
                // Add new one
                newContacts.splice(index, 0, contact);
            }

            return newContacts;
        });
    };

    // Function to handle "drop" on contact list part. Simply removes contact from the list
    const handleDropBackToList = (contact) => {
        setPlanningContacts((prev) => prev.filter((c) => c.id !== contact.id));
    };

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
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} areAllVisible={areAllVisible} />

                <PlanningPane contacts={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} />
            </div>
            <Container className="">
                <Button
                    tooltip="Toggle unmarked contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => setAreAllVisible(!areAllVisible)}>
                    <div>O</div>
                </Button>
            </Container>
        </DndProvider>
    );
};

// Generate list of contacts from list of electrodes
const ContactList = ({ electrodes, onDrop, onClick, droppedContacts, areAllVisible }) => {
    const [, drop] = useDrop(() => ({
        accept: "CONTACT",
        drop: (item) => onDrop(item),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    return (
        <div className="flex-1" ref={drop}>
            <ul className="space-y-4">
                {electrodes.map((electrode) => ( // Vertical list for every electrode
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
                            {electrode.contacts.map((contact, index) => { // Horizontal list for every contact
                                // Filter out the non-marked contacts. NOTE Currently it does not filter off pair of contact added
                                let override = false; // TODO add manual override to show non-marked contacts
                                const shouldAppear = (!(droppedContacts.some((c) => c.id === contact.id)) && contact.isMarked()) || override;
                                return (
                                    areAllVisible ? (
                                        <Contact key={contact.id}
                                            contact={{ ...contact, pair: getCloseContacts(electrode.contacts, index) }}
                                            onClick={onClick} />
                                    ) : (
                                        shouldAppear && (
                                        <Contact key={contact.id}
                                            contact={{ ...contact, pair: getCloseContacts(electrode.contacts, index) }}
                                            onClick={onClick} />
                                        )
                                    )
                                );
                            })} {/* contact */}
                        </ul>
                    </li>
                ))} {/* electrode */}
            </ul>
        </div>
    );
};

// Function to grab two closest contacts.
// Second one will be null if the contact is at the edge
function getCloseContacts(contacts, index) {
    let closest = index > 0 ? contacts[index - 1] : contacts[1];
    let nextClosest = index < contacts.length - 1 ? contacts[index + 1] : contacts[contacts.length - 2];

    if (closest == nextClosest) nextClosest = null;

    return {
        closest: closest,
        alternative: nextClosest
    }
}

// Draggable contact in contact list
const Contact = ({ contact, onClick }) => {
    // Handle "drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    let classes = `min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"} `;
    switch (contact.mark) {
        case 1:
            classes += "bg-red-200";
            break;
        case 2:
            classes += "bg-yellow-200";
            break;
        default:
            classes += "bg-slate-200";
    }

    return (
        <li ref={drag}
            className={classes}
            onClick={() => onClick(contact)} >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
        </li>
    );
};

// Planning pane on the right
const PlanningPane = ({ contacts, onDrop, onDropBack }) => {
    const [hoverIndex, setHoverIndex] = useState(null);

    let index = hoverIndex; // For synchronization between hover and drop

    // Handle "Drop" and hover
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "CONTACT",
        hover: (item, monitor) => {
            if (!monitor.isOver()) return;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            // Estimate the index based on y coordinate
            const hoverY = clientOffset.y;
            let elementSize = 114; // TODO get value more programmatically
            const newIndex = Math.max(0, Math.floor((hoverY - elementSize / 2) / elementSize));
            setHoverIndex(newIndex);
            index = newIndex;
        },
        drop: (item) => {
            onDrop(item, index);
            setHoverIndex(null);
            index = 0;
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    return (
        <div ref={drop} className={`p-4 w-1/6 border-l shadow-lg ${isOver ? "bg-gray-100" : ""}`}>
            <h2 className="text-2xl font-bold mb-4">Planning Pane</h2>
            {contacts.length === 0 ? (
                <p className="text-lg text-gray-500">Drag contacts here</p> // Show text if there are no contacts in the pane
            ) : (
                <ul className="space-y-2 relative">
                    {contacts.map((contact, index) => (
                        <React.Fragment key={contact.id}>
                            {hoverIndex === index && isOver && (
                                <div className="h-1 bg-blue-500 w-full my-1"></div> // Blue bar within the list
                            )}
                            <PlanningContact contact={contact} onDropBack={onDropBack} />
                        </React.Fragment>
                    ))}
                    {hoverIndex >= contacts.length && isOver && (
                        <div className="h-1 bg-blue-500 w-full my-1"></div> // Blue bar at the end of list
                    )}
                </ul>
            )}
            {/* export button. Disabled if no contact is in the list */}
            <button className={`absolute right-10 bottom-10 py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                    contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                    }`} onClick={() => exportContacts(contacts)}>
                export
            </button>
        </div>
    );
};

// Draggable contact in planning pane area
const PlanningContact = ({ contact, onDropBack }) => {
    // Handle "Drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    let classes = `min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
        isDragging ? "opacity-50" : "opacity-100"} `;
    switch (contact.mark) {
    case 1:
        classes += "bg-red-200";
        break;
    case 2:
        classes += "bg-yellow-200";
        break;
    default:
        classes += "bg-slate-200";
    }

    return (
        <li ref={drag}
            className={`p-2 border rounded bg-white shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"
            }`} >
            <p className="text-lg font-semibold">{contact.id}</p>
            <p className="text-sm font-semibold text-gray-500">Location: {contact.associatedLocation}</p>
            <p className="text-sm font-semibold text-gray-500">Pair:  {contact.pair.closest.id}</p> {/* TODO add ability to change closest contact */}
            <button onClick={() => onDropBack(contact)}
                    className="text-red-500 text-sm mt-2 underline" >
                Remove
            </button>
        </li>
    );
};

function exportContacts(contacts) {
    for (let contact of contacts) {
        console.log(contact.id); // Simply put in console for now...
    }
}

export default ContactSelection;
