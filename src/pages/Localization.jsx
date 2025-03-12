import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';
import { saveCSVFile, Identifiers } from '../utils/CSVParser.js';

const Localization = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [expandedElectrode, setExpandedElectrode] = useState(savedState.expandedElectrode || '');
    const [submitFlag, setSubmitFlag] = useState(savedState.submitFlag || false);
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || {});

    useEffect(() => {
        if (initialData.data && !savedState.electrodes) {
            setElectrodes(initialData.data);
        }
    }, [initialData]);

    useEffect(() => {
        onStateChange({
            expandedElectrode,
            submitFlag,
            electrodes
        });
    }, [expandedElectrode, submitFlag, electrodes]);

    const contactTypes = ['GM', 'GM/GM', 'GM/WM', 'WM', 'OOB'];

    const addElectrode = (formData) => {
        const label = formData.get('label');
        const description = formData.get('description');
        const numContacts = formData.get('contacts');

        setElectrodes(prevElectrodes => {
            const tempElectrodes = { ...prevElectrodes };
            tempElectrodes[label] = { description: description };
            for (let i = 1; i <= numContacts; i++) {
                tempElectrodes[label][i] = {
                    contactDescription: description,
                    associatedLocation: ''
                };
            }
            return tempElectrodes;
        });
    };

    const handleSaveLocalization = async (download = false) => {
        try {
            const response = await fetch('http://localhost:5000/api/save-localization', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(electrodes), // Send localization data to the backend
            });

            if (!response.ok) {
              throw new Error('Failed to save localization');
            }

            const result = response.json();
            console.log('Save successful:', result);

            saveCSVFile(Identifiers.LOCALIZATION, electrodes, download);
        }
        catch (error) {
            console.error('Error:', error);
            alert('Failed to save localization. Please try again.');
        }
    };

    const createDesignationTab = () => {
        if (Object.keys(electrodes).length === 0) return;

        // Get designation data from the current localization
        handleSaveLocalization(false);
        const designationData = saveCSVFile(Identifiers.LOCALIZATION, electrodes, false);
        // Create a new tab with the designation data
        const event = new CustomEvent('addDesignationTab', {
            detail: { originalData: electrodes, data: designationData }
        });
        window.dispatchEvent(event);
    };

    const Contact = ({
        label,
        number
    }) => {
        const contactData = electrodes[label][number];
        const associatedLocation = contactData.associatedLocation;

        let displayText = associatedLocation;

        if (associatedLocation === 'GM') {
            displayText = contactData.contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            displayText = `${contactData.contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactData.contactDescription.split('+');
            displayText = `${desc1}/${desc2}`;
        }

        return (
            <Popup
                trigger={<button
                    className="flex flex-col items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-w-[100px]"
                    key={number}>
                    <div className="text-sm font-medium text-gray-700 w-20 h-5">{number}</div>
                    <div className="text-xs text-gray-500 w-20 h-15">{displayText}</div>
                </button>}
                contentStyle={{ width: "500px" }}
                modal
                nested>
                {close => (
                    <div className="modal bg-white p-6 rounded-lg shadow-lg">
                        <h4 className="text-lg font-semibold mb-4">Add Contact</h4>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md mb-4"
                            onChange={(event) => {
                                let temp = electrodes;

                                temp[label][number].associatedLocation = event.target.value;
                                setElectrodes(temp);
                            }}>
                            <option></option>
                            {contactTypes.map((option, i) => {
                                return (
                                    <option key={i}>{option}</option>
                                );
                            })}
                        </select>
                        <button
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                            onClick={() => {
                                setSubmitFlag(!submitFlag);
                                close();
                            }}>
                            Done
                        </button>
                    </div>
                )}
            </Popup>
        );
    };

    const Electrode = ({
        name
    }) => {
        const [label, setLabel] = useState(name);

        return (
            <div className="w-full bg-white rounded-lg shadow-md mb-5 overflow-hidden">
                <button
                    className="w-full flex justify-between items-center p-4 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
                    onClick={() => {
                        if (label === expandedElectrode) {
                            setExpandedElectrode('');
                        } else {
                            setExpandedElectrode(label)
                        }
                    }}
                    key={label}>
                    <div className="text-xl">{label}</div>
                    <div className="text-lg">{electrodes[label].description}</div>
                </button>
                {label === expandedElectrode &&
                    <div className="p-4 bg-gray-50">
                        <div className="flex gap-1 flex-wrap overflow-x-auto"> {/* Delete flex-wrap to make it horizontal scroll */}
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);

                                if (!isNaN(keyNum)) {
                                    return (<Contact label={label} number={key} />);
                                }
                            })}
                        </div>
                    </div>
                }
            </div>
        );
    }

    const Electrodes = () => {
        const orderedKeys = Object.keys(electrodes).sort();

        return (
            <div className="flex flex-col justify-start m-10">
                {orderedKeys.map((key) => { return (<Electrode name={key} key={key} />); })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen p-4 bg-gray-100">
            <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">New Localization</h1>
                    <button
                        className="w-40 bg-sky-700 text-white font-semibold rounded-md py-2 px-4 hover:bg-sky-800 transition-colors duration-200"
                        onClick={() => handleSaveLocalization(true)}
                    >
                        Save Localization
                    </button>
                </div>
                {submitFlag ? <Electrodes /> : <Electrodes />}
            </div>
            <Container>
                <Popup
                    trigger={<Button
                            tooltip="Add a new electrode"
                            styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                            onClick={() => setIsElectrodePopupOpen(true)}>
                            <div>+</div>
                        </Button>}
                    contentStyle={{ width: "500px" }}
                    modal
                    nested>
                    {close => (
                        <div className="modal bg-white p-6 rounded-lg shadow-lg">
                            <h4 className="text-lg font-semibold mb-4">
                                Add Electrode
                            </h4>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const formData = new FormData(event.target);

                                    addElectrode(formData);
                                    setSubmitFlag(!submitFlag);
                                    close();
                                }}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Electrode Label</label>
                                    <input name="label" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input name="description" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Contacts</label>
                                    <input type="number" name="contacts" min="0" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200">Add</button>
                            </form>
                        </div>
                    )}
                </Popup>
            </Container>

            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
                <button
                    className="py-2 px-4 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors duration-200 shadow-lg"
                    onClick={createDesignationTab}
                >
                    Open in Designation
                </button>
            </div>
        </div>
    );
};

export default Localization;
