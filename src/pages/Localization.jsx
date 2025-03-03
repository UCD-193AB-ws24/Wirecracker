import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';

const Localization = ({ initialData = {} }) => {
    const [expandedElectrode, setExpandedElectrode] = useState('');
    const [submitFlag, setSubmitFlag] = useState(false);
    const [electrodes, setElectrodes] = useState(initialData.data || {});

    useEffect(() => {
        if (initialData.data) {
            setElectrodes(initialData.data);
        }
    }, [initialData]);

    const contactTypes = ['GM', 'GM/GM', 'GM/WM', 'WM', 'OOB'];

    const addElectrode = (formData) => {
        const label = formData.get('label');
        const description = formData.get('description');
        const numContacts = formData.get('contacts');
        let tempElectrodes = electrodes;

        tempElectrodes[label] = {'description': description};
        for (let i = 1; i <= numContacts; i++) {
            tempElectrodes[label][i] = { electrodeDescription: description, contactDescription: description, associatedLocation: '' };
        }

        setElectrodes(tempElectrodes);
        console.log('New', electrodes);
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
                        className="w-40 bg-sky-700 text-white font-semibold rounded">
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
