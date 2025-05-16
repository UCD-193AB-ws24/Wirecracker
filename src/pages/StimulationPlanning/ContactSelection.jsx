import { demoContactData } from "./demoData";
import React, { useState, setState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import { saveStimulationCSVFile } from "../../utils/CSVParser";
import mapConsecutive from "../../utils/MapConsecutive";
import config from "../../../config.json" with { type: 'json' };
import { useError } from '../../context/ErrorContext';
import { useWarning } from '../../context/WarningContext';

const ContactSelection = ({ initialData = {}, onStateChange, savedState = {}, switchContent, isFunctionalMapping = false }) => {
    const { showError } = useError();
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || demoContactData)
    const [planningContacts, setPlanningContacts] = useState(() => {
        if (savedState.planningContacts) return savedState.planningContacts;
        const contactsData = initialData.data?.data || initialData.data;
        if (contactsData) {
            return contactsData.map(electrode => {
                return mapConsecutive(electrode.contacts, 2,
                    (contacts) => {
                        return contacts[0].isPlanning ? null : contacts;
                    });
            })
            .flat()
            .filter(Boolean)
            .sort((a, b) => a[0].order - b[0].order);
        }
        return [];
    });
    const [areAllVisible, setAreAllVisible] = useState(savedState.areAllVisible || false);      // Boolean for if all contacts are visible
    const [submitPlanning, setSubmitPlanning] = useState(savedState.submitPlanning || false);

    const [state, setState] = useState(() => {
        if (!savedState.frequency) savedState.frequency = [];
        if (!savedState.duration) savedState.duration = [];
        if (!savedState.current) savedState.current = [];
        if (!savedState.patientId) savedState.patientId = initialData.patientId || null;

        return savedState;
    });

    // Save state changes
    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        setState((prevState) => {
            return {
                ...prevState,
                electrodes: electrodes,
                planningContacts: planningContacts,
                areAllVisible: areAllVisible,
                submitPlanning: submitPlanning,
                patientId: prevState.patientId // Ensure patientId is preserved
            }
        })
    }, [electrodes, planningContacts, areAllVisible, submitPlanning]);

    // Function to handle "drop" on planning pane. Takes contact and index, and insert the contact
    // at the index or at the end if index is not specified. If the contact exist already, this function
    // will change the contact's location to index passed (or to the end)
    const handleDropToPlanning = (contacts, index = "") => {
        setPlanningContacts((prev) => {
            if (index === "") index = prev.length;
            if (index > prev.length) index = prev.length;
            const newContacts = [...prev];

            if (prev.some((c) => c[0].id === contacts[0].id)) {
                // Move existing one
                let oldIndex = prev.indexOf(contacts);
                if (index === oldIndex + 1) return prev; // Ignore if index is one below
                newContacts.splice(index, 0, newContacts.splice(oldIndex, 1)[0]);
            } else {
                // Add new one
                newContacts.splice(index, 0, contacts);
            }

            return newContacts;
        });

        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contacts[0].id) {
                            return { ...c, isPlanning: true };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    // Function to handle "drop" on contact list part. Simply removes contact from the list
    const handleDropBackToList = (contacts) => {
        setPlanningContacts((prev) => prev.filter((c) => c[0].id !== contacts[0].id));
        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contacts[0].id) {
                            return { ...c, isPlanning: false };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    // Add id and such so that it can be used after making pair
    electrodes.map((electrode) => {
        electrode.contacts.map((contact, index) => {
            const contactId = `${electrode.label}${index + 1}`;
            contact.id = contactId;
            contact.index = index + 1;
            contact.electrodeLabel = electrode.label;
        })
    });

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} areAllVisible={areAllVisible} submitPlanning={submitPlanning} onStateChange={setState} savedState={state} setElectrodes={setElectrodes}/>

                <PlanningPane state={state} electrodes={electrodes} contactPairs={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} submitFlag={submitPlanning} setSubmitFlag={setSubmitPlanning} setElectrodes={setElectrodes} onStateChange={setState} savedState={state} isFunctionalMapping={isFunctionalMapping} />
            </div>
            <Container className="">
                <Button
                    tooltip="Toggle unmarked contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => setAreAllVisible(!areAllVisible)}>
                    <div>T</div>
                </Button>
            </Container>

            {/* Floating Back Button at the Bottom Left */}
            <div className="fixed bottom-2 left-2 z-50
                            lg:bottom-6 lg:left-6">
                <button
                    className="py-1 px-2 border border-sky-800 bg-sky-600 text-white text-sm text-center font-bold rounded transition-colors duration-200 cursor-pointer hover:bg-sky-800
                               lg:py-2 lg:px-4 lg:text-base"
                    onClick={() => switchContent('stimulation')}>
                    Back
                </button>
            </div>
        </DndProvider>
    );
};

// Generate list of contacts from list of electrodes
const ContactList = ({ electrodes, onDrop, onClick, droppedContacts, areAllVisible, submitPlanning, onStateChange, savedState, setElectrodes }) => {
    const [submitContact, setSubmitContact] = useState(savedState.submitContact || false);
    useEffect(() => {
        onStateChange((prevState) => {
            return {
                ...prevState,
                submitContact: submitContact
            }
        })
    }, [submitContact]);

    const [, drop] = useDrop(() => ({
        accept: "CONTACT",
        drop: (item) => onDrop(item),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const showAvailableContacts = (electrode) => {
        if (!electrode || !electrode.contacts) return [];
        
        return mapConsecutive(electrode.contacts, 2, (contacts) => { // List for every contact pair
            if (!contacts) return null;

            // Filter out the non-marked contacts.
            const shouldAppear1 = !(droppedContacts.some((c) => c.id === contacts[0].id)) && 
                                  (contacts[0].mark || contacts[1].surgeonMark);
            const shouldAppear2 = (contacts[1].mark || contacts[1].surgeonMark);

            return (
                !(contacts[0].isPlanning) && (
                    areAllVisible ? (
                        <Contact key={contacts[0].id}
                            contacts={contacts}
                            onClick={() => onClick(contacts)} />
                    ) : (
                        (shouldAppear1 || shouldAppear2) && (
                            <Contact key={contacts[0].id}
                                contacts={contacts}
                                onClick={() => onClick(contacts)} />
                        )
                    )
                )
            );
        }).filter(Boolean); // Remove any null entries
    }

    return (
        <div className="flex-1" ref={drop}>
            <ul className="space-y-4">
                {electrodes.map((electrode) => ( // Vertical list for every electrode
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        {(submitContact != submitPlanning) ? (
                            <ul className="flex space-x-4">
                                {showAvailableContacts(electrode)} {/* contact */}
                            </ul>
                        ) : (
                            <ul className="flex space-x-4">
                                {showAvailableContacts(electrode)}
                            </ul>
                        )}
                    </li>
                ))} {/* electrode */}
            </ul>
        </div>
    );
};

// Draggable contact in contact list
const Contact = ({ contacts, onClick }) => {
    // Handle "drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contacts,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    let classes = `min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"} `;
    if (contacts[0].mark == 1 || contacts[1].mark == 1) {
        classes += "bg-rose-300 ";
    } else if (contacts[0].mark == 2 || contacts[1].mark == 2) {
        classes += "bg-amber-300 ";
    } else {
        classes += "bg-stone-300 ";
    }
    if (contacts[0].surgeonMark || contacts[1].surgeonMark) {
        classes += "border-2 border-stone-500";
    } else {
        classes += "border border-gray-300";
    }

    return (
        <li ref={drag}
            className={classes}
            onClick={onClick}
            key={contacts[0].id}>
            <p className="text-xl font-semibold">{contacts[0].index} - {contacts[1].index}</p>
            <p className="text-sm font-semibold text-gray-500">{contacts[0].associatedLocation}</p>
            <p className="text-sm font-semibold text-gray-500">{contacts[1].associatedLocation}</p>
        </li>
    );
};

// Planning pane on the right
const PlanningPane = ({ state, electrodes, contactPairs, onDrop, onDropBack, submitFlag, setSubmitFlag, setElectrodes, onStateChange, savedState, isFunctionalMapping = false }) => {
    const { showError } = useError();
    const [hoverIndex, setHoverIndex] = useState(null);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const { showWarning } = useWarning();

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
            let elementSize = document.querySelector('li.planning-contact')?.clientHeight || 155;
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

    const createTestSelectionTab = async () => {
        if (Object.keys(contactPairs).length === 0) return;

        try {
            console.log('Starting test selection tab creation...');
            console.log('Current state:', {
                fileId: state.fileId,
                patientId: state.patientId,
                fileName: state.fileName
            });

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                showError('User not authenticated. Please log in to save stimulation.');
                return;
            }

            // Fetch patient_id from the parent file if not already in state
            if (!state.patientId) {
                console.log('Fetching patient_id from parent file...');
                const parentFileResponse = await fetch(`${config.backendURL}/api/files/patient/${state.fileId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const parentFileData = await parentFileResponse.json();
                console.log('Parent file metadata response:', parentFileData);

                if (!parentFileData.patientId) {
                    console.error('Failed to fetch parent file metadata:', parentFileData.error);
                    showError('Failed to fetch parent file metadata. Please try again.');
                    return;
                }

                // Update state with the patient ID
                onStateChange({
                    ...state,
                    patientId: parentFileData.patientId
                });
            }

            const parentPatientId = state.patientId;
            console.log('Using patient_id:', parentPatientId);

            await handleSave();

            // Clean up the contacts
            const functionalTestData = contacts.map(contact => {
                const updatedContact = electrodes
                    .flatMap(electrode => electrode.contacts)
                    .find(c => c.id === contact.id);

                const pair = electrodes
                    .find(electrode => electrode.label === contact.electrodeLabel)
                    ?.contacts.find(c => c.index === contact.pair);

                return {
                    __contactDescription__: contact.__contactDescription__,
                    __electrodeDescription__: contact.__electrodeDescription__,
                    associatedLocation: contact.associatedLocation,
                    electrodeLabel: contact.electrodeLabel,
                    id: contact.id,
                    index: contact.index,
                    mark: contact.mark,
                    pair: pair,
                    surgeonMark: contact.surgeonMark,
                    duration: updatedContact?.duration,
                    frequency: updatedContact?.frequency,
                    current: updatedContact?.current,
                }
            });

            // Check if a test selection tab already exists in the UI
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab => 
                tab.content === 'functional-test' && 
                tab.state?.patientId === parentPatientId
            );
            
            if (existingTab) {
                // Compare the current stimulation data with the existing tab's data
                const currentStimulationData = functionalTestData;
                const existingStimulationData = existingTab.state.contacts;
                
                // Check if the stimulation data has changed
                const hasStimulationChanged = JSON.stringify(currentStimulationData) !== JSON.stringify(existingStimulationData);
                
                if (hasStimulationChanged) {
                    // Close the existing tab
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);

                    // Create a new tab with updated data
                    const event = new CustomEvent('addFunctionalTestTab', {
                        detail: { 
                            data: { 
                                contacts: functionalTestData, 
                                tests: existingTab.state.tests || {} // Preserve existing tests
                            },
                            patientId: parentPatientId,
                            state: {
                                patientId: parentPatientId,
                                fileId: existingTab.state.fileId,
                                fileName: existingTab.state.fileName,
                                creationDate: existingTab.state.creationDate,
                                modifiedDate: new Date().toISOString()
                            },
                            originalData: {
                                patientId: parentPatientId
                            }
                        }
                    });
                    window.dispatchEvent(event);
                } else {
                    // Just set the existing tab as active
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                }
            } else {
                // Check if test data exists in the database for this patient
                const testResponse = await fetch(`${config.backendURL}/api/by-patient-test/${parentPatientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!testResponse.ok) {
                    throw new Error('Failed to check for existing test data');
                }

                const testResult = await testResponse.json();
                
                // Create a new tab with the test selection data
                const event = new CustomEvent('addFunctionalTestTab', {
                    detail: { 
                        data: { 
                            contacts: functionalTestData, 
                            tests: testResult.exists ? testResult.data.tests : {}
                        },
                        patientId: parentPatientId,
                        state: {
                            patientId: parentPatientId,
                            fileId: testResult.exists ? testResult.fileId : null
                        }
                    }
                });
                window.dispatchEvent(event);
            }
            console.log('Test selection tab creation completed successfully');
        } catch (error) {
            console.error('Error creating test selection tab:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            showError('Failed to create test selection tab. Please try again.');
        }
    };

    const handleSave = async () => {
        try {
            await exportState(state, electrodes, isFunctionalMapping, false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error saving:', error);
                showError(error.message);
            }
        }
    };

    return (
        <div ref={drop} className={`p-4 w-1/4 border-l shadow-lg ${isOver ? "bg-gray-100" : ""}`}>
            <h2 className="text-2xl font-bold mb-4">Planning Pane</h2>
            {contactPairs.length === 0 ? (
                <p className="text-lg text-gray-500">Drag contacts here</p>
            ) : (
                <ul className="space-y-2 relative">
                    {contactPairs.map((contacts, index) => (
                        <React.Fragment key={contacts[0].id}>
                            {hoverIndex === index && isOver && (
                                <div className="h-1 bg-blue-500 w-full my-1"></div>
                            )}
                            <PlanningContact contacts={contacts} onDropBack={onDropBack} onStateChange={onStateChange} savedState={savedState} setElectrodes={setElectrodes} />
                        </React.Fragment>
                    ))}
                    {hoverIndex >= contactPairs.length && isOver && (
                        <div className="h-1 bg-blue-500 w-full my-1"></div>
                    )}
                </ul>
            )}
            <div className="flex space-x-2 absolute right-10 bottom-10">
                {isFunctionalMapping ? (
                    <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                            contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                            }`} onClick={createTestSelectionTab}>
                        select tests
                    </button>
                ) : (
                    <div />
                )}

                <div className="relative">
                    <button
                        className={`py-2 px-4 bg-green-500 text-white font-bold rounded ${
                            contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700 border border-green-700"
                        }`}
                        onClick={handleSave}
                        disabled={contactPairs.length === 0}
                    >
                        Save
                    </button>
                    {showSaveSuccess && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm whitespace-nowrap z-50">
                            Save successful!
                        </div>
                    )}
                </div>

                <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                        contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                        }`} onClick={async () => {
                            try {
                                await exportState(state, electrodes, isFunctionalMapping, true);
                            } catch (error) {
                                if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                                    showWarning("No internet connection. The progress is not saved on the database.");
                                } else {
                                    console.error('Error exporting:', error);
                                    showError(error.message);
                                }
                            }
                        }}>
                    Export
                </button>
            </div>
        </div>
    );
};

// Draggable contact in planning pane area
const PlanningContact = ({ contacts, onDropBack, onStateChange, savedState, setElectrodes }) => {
    // To persist between tab switch and reload
    const [frequency, setFrequency] = useState(savedState.frequency?.[contacts[0].id] || contacts[0].frequency || 0);
    const [duration, setDuration] = useState(savedState.duration?.[contacts[0].id] || contacts[0].duration || 0);
    const [current, setCurrent] = useState(savedState.current?.[contacts[0].id] || contacts[0].current || 0);

    // Handle "Drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contacts,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // Update savedState when inputs change
    const updateSavedState = (field, value) => {
        onStateChange((prevState) => {
            return {
                ...prevState,
                [field]: {
                    ...prevState[field],
                    [contacts[0].id]: value,
                },
            };
        });
    };

    const updateContact = (field, value) => {
        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contacts[0].id) {
                            return { ...c, [field]: value };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    const handleFrequencyChange = (e) => {
        const value = parseFloat(e.target.value);
        setFrequency(value);
        updateContact("frequency", value);
        updateSavedState("frequency", value);
    };

    const handleDurationChange = (e) => {
        const value = parseFloat(e.target.value);
        setDuration(value);
        updateContact("duration", value);
        updateSavedState("duration", value);
    };

    const handleCurrentChange = (e) => {
        const value = parseFloat(e.target.value);
        setCurrent(value);
        updateContact("current", value);
        updateSavedState("current", value);
    };

    let classes = `planning-contact p-2 border rounded-lg shadow cursor-pointer ${
        isDragging ? "opacity-50" : "opacity-100"} `;
    if (contacts[0].mark == 1 || contacts[1].mark == 1) {
        classes += "bg-rose-300 ";
    } else if (contacts[0].mark == 2 || contacts[1].mark == 2) {
        classes += "bg-amber-300 ";
    } else {
        classes += "bg-stone-300 ";
    }
    if (contacts[0].surgeonMark || contacts[1].surgeonMark) {
        classes += "border-2 border-stone-500";
    } else {
        classes += "border border-gray-300";
    }

    return (
        <li ref={drag}
            className={classes}
            key={contacts[0].id}>
            <p className="text-lg font-semibold">{contacts[0].id}-{contacts[1].index}</p>
            <p className="text-sm font-semibold text-gray-500">Location: {contacts[0].associatedLocation}</p>
            <p className="text-sm font-semibold text-gray-500">Location: {contacts[1].associatedLocation}</p>

            <div className="flex space-x-2 mt-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Frequency (Hz)</label>
                    <input
                        type="number"
                        value={frequency}
                        onChange={handleFrequencyChange}
                        className="w-full p-1 border rounded bg-white"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Duration (s)</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={handleDurationChange}
                        className="w-full p-1 border rounded bg-white"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Current (mA)</label>
                    <input
                        type="number"
                        value={current}
                        onChange={handleCurrentChange}
                        className="w-full p-1 border rounded bg-white"
                    />
                </div>
            </div>

            <button onClick={() => onDropBack(contacts)}
                    className="text-red-500 text-sm mt-2 underline" >
                Remove
            </button>
        </li>
    );
};

const exportState = async (state, electrodes, isFunctionalMapping, download = true) => {
    let planOrder = state.planningContacts.map(contacts => contacts[0].id);
    try {
        // First save to database if we have a file ID
        if (state.fileId) {
            console.log('Saving stimulation plan to database...');
            console.log('Current state:', {
                fileId: state.fileId,
                patientId: state.patientId,
                fileName: state.fileName
            });

            // Get user ID from session
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('User not authenticated. Please log in to save designations.');
            }
            
            try {
                // Save stimulation data to database
                console.log('Saving stimulation data with patient_id:', state.patientId);
                const response = await fetch(`${config.backendURL}/api/save-stimulation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        electrodes: electrodes,
                        planOrder: planOrder,
                        isFunctionalMapping: isFunctionalMapping,
                        fileId: state.fileId,
                        fileName: state.fileName,
                        creationDate: state.creationDate,
                        modifiedDate: new Date().toISOString(),
                        patientId: state.patientId
                    }),
                });

                const result = await response.json();
                console.log('Save stimulation response:', result);
                if (!result.success) {
                    console.error('Failed to save stimulation:', result.error);
                    throw error;
                }

                console.log('Stimulation saved successfully');
            } catch (error) {
                console.error('Error saving stimulation:', error);
                throw error;
            }
        }
    } catch (error) {
        console.error('Error exporting contacts:', error);
        throw error;
    } finally {
        if (download) {
            saveStimulationCSVFile(electrodes, planOrder, isFunctionalMapping, download);
        }
    }
};

export default ContactSelection;
