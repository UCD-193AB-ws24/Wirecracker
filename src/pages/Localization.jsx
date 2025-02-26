import { useState } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, Link } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';

const Localization = () => {
    let electrodes = {};

    const addElectrode = (formData) => {
        const label = formData.get('label');
        const description = formData.get('description');
        const numContacts = formData.get('contacts');

        electrodes[label] = {'description': description};
        for (let i = 1; i <= numContacts; i++) {
            electrodes[label][i] = '';
        }
    };

    return (
        <div>
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
                            <form action={addElectrode} onSubmit={() => close()}>
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