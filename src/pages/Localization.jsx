<<<<<<< HEAD
import { useState } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, Link } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';

const Localization = () => {
    const [expandedElectrode, setExpandedElectrode] = useState('');
    const [submitFlag, setSubmitFlag] = useState(false);
    const [electrodes, setElectrodes] = useState({});

    const addElectrode = (formData) => {
        const label = formData.get('label');
        const description = formData.get('description');
        const numContacts = formData.get('contacts');
        let tempElectrodes = electrodes;

        tempElectrodes[label] = {'description': description};
        for (let i = 1; i <= numContacts; i++) {
            tempElectrodes[label][i] = '';
        }

        setElectrodes(tempElectrodes);
        console.log('New', electrodes);
    };

    const Electrode = ({
        name
    }) => {
        const [label, setLabel] = useState(name);

        return (
            <div>
                <button
                    className="flex"
                    onClick={() => {
                        if (label === expandedElectrode) {
                            setExpandedElectrode('');
                        } else {
                            setExpandedElectrode(label)
                        }
                    }}
                    key={label}>
                    <div className="bg-blue-300 text-white font-semibold">{label}</div>
                    <div>{electrodes[label].description}</div>
                </button>
                {label === expandedElectrode &&
                    <>
                        <div className="flex">
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);

                                if (!isNaN(keyNum)) {
                                    return (
                                        <button
                                            className="flex flex-col items-center"
                                            key={key}>
                                            <div>{key}</div>
                                            <div>{electrodes[label][key]}</div>
                                        </button>
                                    );
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
        console.log(orderedKeys);

        return (
            <div className="h-screen flex justify-center items-center">
                {orderedKeys.map((key) => { return (<Electrode name={key} key={key} />); })}
            </div>
        );
    };

    return (
        <div>
            {submitFlag ? <Electrodes /> : <Electrodes />}
            <Container>
                <Popup
                    trigger={<Button
                            tooltip="Add a new electrode"
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
=======
import React from 'react';

const Localization = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">New Localization</h1>
            {/* Add your localization form/content here */}
        </div>
    );
};

export default Localization; 
>>>>>>> 8ab2880aea87ce48fe9b82174a73754cb2f92970
