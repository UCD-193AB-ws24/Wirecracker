import { demoContactData } from "./demoData";
import React, { useState, setState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import { saveStimulationCSVFile } from "../../utils/CSVParser";
import mapConsecutive from "../../utils/MapConsecutive";
import { useError } from '../../context/ErrorContext';
import { useWarning } from '../../context/WarningContext';
import HelpButton from "../../utils/HelpButton";

const backendURL = __APP_CONFIG__.backendURL;

const ContactSelection = ({ initialData = {}, onStateChange, savedState = {}, switchContent, type = 'mapping' }) => {
    const { showError } = useError();
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || demoContactData)
    const [planningContacts, setPlanningContacts] = useState(() => {
        if (savedState.planningContacts) return savedState.planningContacts;
        const contactsData = initialData.data?.data || initialData.data;
        if (contactsData) {
            return contactsData.map(electrode => {
                return mapConsecutive(electrode.contacts, 2,
                    (contacts) => {
                        if (contacts[0].isPlanning) {
                            return contacts;
                        }
                        return null;
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
            <div className="flex min-h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} areAllVisible={areAllVisible} submitPlanning={submitPlanning} onStateChange={setState} savedState={state} setElectrodes={setElectrodes}/>

                <PlanningPane state={state} electrodes={electrodes} contactPairs={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} submitFlag={submitPlanning} setSubmitFlag={setSubmitPlanning} setElectrodes={setElectrodes} onStateChange={setState} savedState={state} type={type} />
            </div>
            <HelpButton
                title="Contact Stimulation Page Help"
                instructions="Click on or drag contact pairs in and out of the planning panel on the right. Select the length of time and power of the stimulation test."
            />
            <Container className="">
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

            // Only show contacts that haven't been dropped to planning
            const notDropped = !(droppedContacts.some((c) => c.id === contacts[0].id));

            // In default state, only show pairs where both contacts have surgeonMark
            const bothSurgeonMarked = contacts[0].surgeonMark && contacts[1].surgeonMark;

            return (
                !(contacts[0].isPlanning) && (
                    areAllVisible ? (
                        notDropped && (
                            <Contact key={contacts[0].id}
                                contacts={contacts}
                                onClick={() => onClick(contacts)} />
                        )
                    ) : (
                        notDropped && bothSurgeonMarked && (
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

    let classes = `w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"} `;
    if (contacts[0].mark == 1 || contacts[1].mark == 1) {
        classes += "bg-rose-300 ";
    } else if (contacts[0].mark == 2 || contacts[1].mark == 2) {
        classes += "bg-amber-300 ";
    } else {
        classes += "bg-stone-300 ";
    }
    if (contacts[0].surgeonMark && contacts[1].surgeonMark) {
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
const PlanningPane = ({ state, electrodes, contactPairs, onDrop, onDropBack, submitFlag, setSubmitFlag, setElectrodes, onStateChange, savedState, type = 'ccep' }) => {
    const { showError } = useError();
    const [hoverIndex, setHoverIndex] = useState(null);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const { showWarning } = useWarning();
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [isSharing, setIsSharing] = useState(false);

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

    const handleSave = async () => {
        try {
            await exportState(state, electrodes, type, false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error saving:', error);
                showError(error.message);
            }
        }
    };

    const handleExport = () => {
        try {
            exportState(state, electrodes, type, true);
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error exporting:', error);
                showError(error.message);
            }
        }
    };

    // Get display name for stimulation type
    const getStimulationTypeDisplay = () => {
        switch(type) {
            case 'mapping':
                return 'Functional Mapping';
            case 'recreation':
                return 'Seizure Recreation';
            case 'ccep':
                return 'CCEPs';
            default:
                return 'Stimulation';
        }
    };

    /**
     * Handles opening the test selection page
     * @async
     */
    const handleOpenTestSelection = async () => {
        try {
            await handleSave();

            // First check if any test selection tabs for this patient already exist
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab => 
                (tab.content === 'functional-test' || tab.content === 'csv-functional-test') && 
                tab.state?.patientId === state.patientId
            );

            if (existingTab) {
                // Compare modified dates
                const existingModifiedDate = existingTab.state.modifiedDate;
                const stimulationModifiedDate = state.modifiedDate;

                if (existingModifiedDate > stimulationModifiedDate) {
                    // Switch to existing tab as it's newer
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                    return;
                } else {
                    // Close existing tab as it's older
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);
                }
            } else {
                // Check database for existing file
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('User not authenticated');
                    }

                    const response = await fetch(`${backendURL}/api/by-patient-test/${state.patientId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        }
                    });

                    const result = await response.json();
                    
                    if (result.success && result.exists) {
                        const dbModifiedDate = result.data.modified_date;
                        const stimulationModifiedDate = state.modifiedDate;

                        if (dbModifiedDate > stimulationModifiedDate) {
                            // Create tab from database file
                            const event = new CustomEvent('addFunctionalTestTab', {
                                detail: {
                                    data: result.data.test_selection_data,
                                    state: {
                                        ...result.data,
                                        fileName: 'Neuropsychology',
                                        fileId: result.fileId,
                                        patientId: state.patientId
                                    }
                                }
                            });
                            window.dispatchEvent(event);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking database for existing file:', error);
                    // Continue with creating new tab if database check fails
                }
            }

            // Create a new tab with the test selection data
            const event = new CustomEvent('addFunctionalTestTab', {
                detail: { 
                    data: electrodes,
                    state: {
                        patientId: state.patientId,
                        fileId: existingTab?.state?.fileId || null,
                        fileName: 'Neuropsychology',
                        creationDate: state.creationDate,
                        modifiedDate: new Date().toISOString()
                    }
                }
            });
            window.dispatchEvent(event);

        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database. Make sure to download your progress.");
            } else {
                console.error('Error opening test selection:', error);
                showError('Failed to open test selection. Please try again.');
            }
        }
    };

    const handleShareWithNeuropsychologist = async () => {
        if (!shareEmail) {
            showError('Please enter an email address');
            return;
        }

        setIsSharing(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Starting share process...');
            console.log('Current state:', {
                fileId: state.fileId,
                patientId: state.patientId,
                electrodes
            });

            // First save the epilepsy file
            console.log('Saving epilepsy file...');
            await handleSave();
            console.log('Epilepsy file saved successfully');

            // Now share the file
            console.log('Sharing file with neuropsychologist...');
            console.log('Request URL:', `${backendURL}/api/files/share-with-neuropsychologist`);
            console.log('Request headers:', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            });
            console.log('Request body:', {
                fileId: state.fileId,
                email: shareEmail,
                testSelectionData: {
                    tests: electrodes,
                    contacts: Object.keys(electrodes).reduce((acc, electrodeLabel) => {
                        const electrode = electrodes[electrodeLabel];
                        Object.entries(electrode).forEach(([key, value]) => {
                            if (!isNaN(parseInt(key))) {
                                acc.push({
                                    contactNumber: parseInt(key),
                                    electrodeLabel: electrodeLabel,
                                    contactDescription: value.contactDescription || electrode.description,
                                    associatedLocation: value.associatedLocation || 'WM'
                                });
                            }
                        });
                        return acc;
                    }, [])
                }
            });

            const response = await fetch(`${backendURL}/api/files/share-with-neuropsychologist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileId: state.fileId,
                    email: shareEmail,
                    testSelectionData: {
                        tests: electrodes,
                        contacts: Object.keys(electrodes).reduce((acc, electrodeLabel) => {
                            const electrode = electrodes[electrodeLabel];
                            Object.entries(electrode).forEach(([key, value]) => {
                                if (!isNaN(parseInt(key))) {
                                    acc.push({
                                        contactNumber: parseInt(key),
                                        electrodeLabel: electrodeLabel,
                                        contactDescription: value.contactDescription || electrode.description,
                                        associatedLocation: value.associatedLocation || 'WM'
                                    });
                                }
                            });
                            return acc;
                        }, [])
                    }
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Log the raw response text first
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Try to parse as JSON if possible
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Parsed response:', result);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(result.error || 'Failed to share file');
            }

            if (result.success) {
                showWarning('File shared successfully with neuropsychologist');
                setShowShareModal(false);
                setShareEmail('');
            } else {
                throw new Error(result.error || 'Failed to share file');
            }
        } catch (error) {
            console.error('Error sharing file:', error);
            showError(error.message || 'Failed to share file with neuropsychologist');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div ref={drop} className={`p-4 w-1/4 border-l shadow-lg ${isOver ? "bg-gray-100" : ""}`}>
            {/* First row of buttons */}
            <div className="flex space-x-2 mb-4">
                <div className="relative w-1/2">
                    <button
                        className={`w-full py-2 px-4 bg-green-500 text-white font-bold rounded ${
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
                <button
                    className={`w-1/2 py-2 px-4 bg-sky-500 text-white font-bold rounded ${
                        contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-sky-700 border border-sky-700"
                    }`}
                    onClick={handleExport}
                    disabled={contactPairs.length === 0}
                >
                    Export
                </button>
            </div>

            {/* Second row of buttons - only show for functional mapping */}
            {type === 'mapping' && (
                <div className="flex space-x-2 mb-4">
                    <button
                        className={`flex-1 py-2 px-4 bg-blue-500 border border-blue-600 text-white font-semibold rounded transition-colors duration-200 shadow-lg ${
                            contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600 cursor-pointer"
                        }`}
                        onClick={() => setShowShareModal(true)}
                        disabled={contactPairs.length === 0}>
                        Share with Neuropsychologist
                    </button>
                    <button
                        className={`flex-1 py-2 px-4 bg-indigo-500 border border-indigo-600 text-white font-semibold rounded transition-colors duration-200 shadow-lg ${
                            contactPairs.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-600 cursor-pointer"
                        }`}
                        onClick={handleOpenTestSelection}
                        disabled={contactPairs.length === 0}>
                        Open in Neuropsychology
                    </button>
                </div>
            )}

            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Planning</h2>
                <p className="text-sm text-gray-600">{getStimulationTypeDisplay()}</p>
            </div>

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

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Share with Neuropsychologist</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Neuropsychologist's Email
                            </label>
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Enter email address"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowShareModal(false);
                                    setShareEmail('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                disabled={isSharing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareWithNeuropsychologist}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                disabled={isSharing}
                            >
                                {isSharing ? 'Sharing...' : 'Share'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    if (contacts[0].surgeonMark && contacts[1].surgeonMark) {
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

const exportState = async (state, electrodes, type, download = true) => {
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
                throw new Error('User not authenticated. Please log in to save.');
            }
            
            try {
                // Save stimulation data to database
                console.log('Saving stimulation data with patient_id:', state.patientId);
                const response = await fetch(`${__APP_CONFIG__.backendURL}/api/save-stimulation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        electrodes: electrodes,
                        planOrder: planOrder,
                        type: type,
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
            saveStimulationCSVFile(electrodes, planOrder, type, state.patientId, state.creationDate, state.modifiedDate, download, state.fileId);
        }
    }
};

export default ContactSelection;
