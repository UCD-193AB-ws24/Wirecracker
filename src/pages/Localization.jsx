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

    const handleSaveLocalization = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/save-localization', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(electrodes), // Send localization data to the backend
            });

            console.log(JSON.stringify(electrodes));
        
            if (!response.ok) {
              throw new Error('Failed to save localization');
            }
        
            const result = response.json();
            console.log('Save successful:', result);

            saveCSVFile(Identifiers.LOCALIZATION, electrodes);
        }
        catch (error) {
            console.error('Error:', error);
            alert('Failed to save localization. Please try again.');
        }
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
                    className="flex flex-col items-center border-r"
                    key={number}>
                    <div className="w-20 h-5">{number}</div>
                    <div className="w-20 h-15">{displayText}</div>
                </button>}
                modal
                nested>
                {close => (
                    <div className="modal flex flex-col">
                        <h4>Add Contact</h4>
                        <select
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
            <div className="w-full outline-solid rounded mb-5">
                <button
                    className="w-full flex justify-start align-center border-b"
                    onClick={() => {
                        if (label === expandedElectrode) {
                            setExpandedElectrode('');
                        } else {
                            setExpandedElectrode(label)
                        }
                    }}
                    key={label}>
                    <div className="w-20 h-10 bg-blue-400 text-white font-semibold align-middle font-semibold text-2xl">{label}</div>
                    <div className="h-10 pl-2 align-middle font-semibold text-2xl">{electrodes[label][1].electrodeDescription}</div>
                </button>
                {label === expandedElectrode &&
                    <>
                        <div className="flex">
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);

                                if (!isNaN(keyNum)) {
                                    return (<Contact label={label} number={key} />);
                                }
                            })}
                        </div>
                    </>
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
        <div>
            <div className="p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold mb-4">New Localization</h1>
                    <button
                        className="w-40 bg-sky-700 text-white font-semibold rounded"
                        onClick={handleSaveLocalization}
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
                    modal
                    nested>
                    {close => (
                        <div className="modal">
                            <h4>
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
                                <div>
                                    <div>Electrode Label</div>
                                    <input name="label" />
                                </div>
                                <div>
                                    <div>Description</div>
                                    <input name="description" />
                                </div>
                                <div>
                                    <div>Number of Contacts</div>
                                    <input type="number" name="contacts" min="0" />
                                </div>
                                <button type="submit">Add</button>
                            </form>
                        </div>
                    )}
                </Popup>
            </Container>
        </div>
    );
};

export default Localization;
