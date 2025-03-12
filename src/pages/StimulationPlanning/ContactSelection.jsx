import { demoContactData } from "./demoData";
import React, { useState, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';

const ContactSelection = ({ electrodes = demoContactData, switchContent, isFunctionalMapping = false }) => {
    const [planningContacts, setPlanningContacts] = useState([]);   // TODO Connect planningContacts to backend to save the state
    const [areAllVisible, setAreAllVisible] = useState(false);      // Boolean for if all contacts are visible
    const [isPairing, setIsPairing] = useState(false);
    const [submitPlanning, setSubmitPlanning] = useState(false);

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
        contact.isPlanning = true;
    };

    // Function to handle "drop" on contact list part. Simply removes contact from the list
    const handleDropBackToList = (contact) => {
        setPlanningContacts((prev) => prev.filter((c) => c.id !== contact.id));
        contact.isPlanning = false;
    };

    // Add id and such so that it can be used after making pair
    electrodes.map((electrode) => {
        electrode.contacts.map((contact, index) => {
            const contactId = `${electrode.label}${index + 1}`;
            contact.id = contactId;
            contact.electrodeLabel = electrode.label;
            contact.index = index + 1;
        })
    });

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} areAllVisible={areAllVisible} isPairing={isPairing} submitPlanning={submitPlanning} />

                <PlanningPane contacts={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} submitFlag={submitPlanning} setSubmitFlag={setSubmitPlanning} switchContent={switchContent} isFunctionalMapping={isFunctionalMapping} />
            </div>
            <Container className="">
                <Button
                    tooltip="Pair contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => {setIsPairing(!isPairing)}}>
                    <div>P</div>
                </Button>
                <Button
                    tooltip="Toggle unmarked contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => setAreAllVisible(!areAllVisible)}>
                    <div>T</div>
                </Button>
            </Container>
        </DndProvider>
    );
};

// Generate list of contacts from list of electrodes
const ContactList = ({ electrodes, onDrop, onClick, droppedContacts, areAllVisible, isPairing, submitPlanning }) => {
    const [submitContact, setSubmitContact] = useState(false);

    const [, drop] = useDrop(() => ({
        accept: "CONTACT",
        drop: (item) => onDrop(item),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const handleOnClick = (electrode, contact) => {
        if (isPairing) {
            changePair(electrode, contact);
        } else {
            onClick(contact);
        }
        setSubmitContact(!submitContact);
    }

    const changePair = (electrode, contact) => {
        // One or fewer contacts in electrode
        if (electrode.contacts.length <= 1) {
            return;
        }

        // Reset the saved pair of the current contact's pair
        var pairedContact = electrode.contacts[contact.pair - 1];
        electrode.contacts[contact.pair - 1].pair = pairedContact.index;

        // Change the current contact's saved pair
        if (contact.pair === contact.index - 1) {
            contact.pair += 2;
            if (electrode.contacts.length <= contact.index) {
                contact.pair--;
            }
        } else {
            contact.pair--;
            if (contact.pair < 1 && contact.index === 2 && electrode.contacts.length > 2) {
                contact.pair += 3;
            } else if (contact.pair < 1 && (contact.index === 1 || contact.index === 2)) {
                contact.pair += 2;
            }
        }

        // Reset new pair's previous pairing
        pairedContact = electrode.contacts[contact.pair - 1];
        electrode.contacts[pairedContact.pair - 1].pair = electrode.contacts[pairedContact.pair - 1].index;

        // Change the new pair's pairing
        electrode.contacts[contact.pair - 1].pair = contact.index;
    }

    return (
        <div className="flex-1" ref={drop}>
            <ul className="space-y-4">
                {electrodes.map((electrode) => ( // Vertical list for every electrode
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        {(submitContact != submitPlanning) ? (
                            <ul className="flex space-x-4">
                                {electrode.contacts.map((contact, index) => { // Horizontal list for every contact
                                    const pair = electrode.contacts[contact.pair - 1];

                                    // Filter out the non-marked contacts.
                                    const shouldAppear = !(droppedContacts.some((c) => c.id === contact.id)) && contact.isMarked();
                                    const pairShouldAppear = !(droppedContacts.some((c) => c.id === pair.id)) && pair.isMarked();

                                    return (
                                        !(contact.isPlanning || pair.isPlanning) && (
                                            areAllVisible ? (
                                                <Contact key={contact.id}
                                                    contact={contact}
                                                    onClick={() => handleOnClick(electrode, contact)} />
                                            ) : (
                                                (shouldAppear || pairShouldAppear) && (
                                                <Contact key={contact.id}
                                                    contact={contact}
                                                    onClick={() => handleOnClick(electrode, contact)} />
                                                )
                                            )
                                        )
                                    );
                                })} {/* contact */}
                            </ul>
                        ) : (
                            <ul className="flex space-x-4">
                                {electrode.contacts.map((contact, index) => { // Horizontal list for every contact
                                    const pair = electrode.contacts[contact.pair - 1];

                                    // Filter out the non-marked contacts.
                                    const shouldAppear = !(droppedContacts.some((c) => c.id === contact.id)) && contact.isMarked();
                                    const pairShouldAppear = !(droppedContacts.some((c) => c.id === pair.id)) && pair.isMarked();

                                    return (
                                        !(contact.isPlanning || pair.isPlanning) && (
                                            areAllVisible ? (
                                                <Contact key={contact.id}
                                                    contact={contact}
                                                    onClick={() => handleOnClick(electrode, contact)} />
                                            ) : (
                                                (shouldAppear || pairShouldAppear) && (
                                                <Contact key={contact.id}
                                                    contact={contact}
                                                    onClick={() => handleOnClick(electrode, contact)} />
                                                )
                                            )
                                        )
                                    );
                                })} {/* contact */}
                            </ul>
                        )}
                    </li>
                ))} {/* electrode */}
            </ul>
        </div>
    );
};

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
            onClick={onClick}
            key={contact.index}>
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
            <p className="text-sm font-semibold text-gray-500">Pair:  {contact.pair}</p>
        </li>
    );
};

// Planning pane on the right
const PlanningPane = ({ contacts, onDrop, onDropBack, submitFlag, setSubmitFlag, switchContent, isFunctionalMapping = false }) => {
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
            item.isPlanning = true;
            setSubmitFlag(!submitFlag);
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
            <div className="flex space-x-2 absolute right-10 bottom-10 ">
                {isFunctionalMapping ? (
                    <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                            contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                            }`} onClick={() => switchContent('functional-test')}>
                        select tests
                    </button>
                ) : (
                    <div />

                )}

                {/* export button. Disabled if no contact is in the list */}
                <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                        contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                        }`} onClick={() => exportContacts(contacts)}>
                    export
                </button>
            </div>
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
            }`}
            key={contact.id}>
            {(contact.pair === contact.index) ? (
                <p className="text-lg font-semibold">{contact.id}</p>
            ) : (
                <p className="text-lg font-semibold">{contact.id} and {contact.electrodeLabel + contact.pair}</p>
            )}
            <p className="text-sm font-semibold text-gray-500">Location: {contact.associatedLocation}</p>
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
