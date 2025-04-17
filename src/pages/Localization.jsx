import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';
import { saveCSVFile, Identifiers } from '../utils/CSVParser.js';
import { supabase } from '../utils/supabaseClient';
import config from "../../config.json" with { type: 'json' };
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const backendURL = config.backendURL;

const Localization = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [expandedElectrode, setExpandedElectrode] = useState(savedState.expandedElectrode || '');
    const [submitFlag, setSubmitFlag] = useState(savedState.submitFlag || false);
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || {});
    const [fileId, setFileId] = useState(savedState.fileId || null);
    const [fileName, setFileName] = useState(savedState.fileName || 'New Localization');
    const [creationDate, setCreationDate] = useState(savedState.creationDate || new Date().toISOString());
    const [modifiedDate, setModifiedDate] = useState(savedState.modifiedDate || new Date().toISOString());

    useEffect(() => {
        if (initialData.data && !savedState.electrodes) {
            setElectrodes(initialData.data);
        }
        
        // Generate a file ID if none exists
        if (!fileId) {
            setFileId(generateUniqueId());
        }

        // Update file name from saved state
        if (savedState.fileName) {
            setFileName(savedState.fileName);
        }
    }, [initialData, savedState]);

    useEffect(() => {
        onStateChange({
            expandedElectrode,
            submitFlag,
            electrodes,
            fileId,
            fileName,
            creationDate,
            modifiedDate
        });
    }, [expandedElectrode, submitFlag, electrodes, fileId, fileName, creationDate, modifiedDate]);

    // Generate a unique ID for the file - using integer only for database compatibility
    const generateUniqueId = () => {
        // Use timestamp as integer ID (last 9 digits to fit in int4 range)
        return Math.floor(Date.now() % 1000000000);
    };

    const contactTypes = ['GM', 'GM/GM', 'GM/WM', 'WM', 'OOB'];

    const addElectrode = (formData) => {
        // Sanitize inputs by removing commas and semicolons
        const label = formData.get('label').replace(/[,;]/g, '');
        const description = formData.get('description').replace(/[,;]/g, '');
        const numContacts = formData.get('contacts');
        const electrodeType = formData.get('electrodeType') || 'DIXI'; // Default to DIXI if not specified

        setElectrodes(prevElectrodes => {
            const tempElectrodes = { ...prevElectrodes };
            
            // Check if we're editing an existing electrode
            const existingElectrode = tempElectrodes[label];
            
            if (existingElectrode) {
                // Store the old description for comparison
                const oldDescription = existingElectrode.description;
                
                // Update the existing electrode's description and type
                tempElectrodes[label].description = description;
                tempElectrodes[label].type = electrodeType;
                
                // If the number of contacts has changed, update accordingly
                const currentContacts = Object.keys(existingElectrode).filter(key => !isNaN(parseInt(key)));
                const currentCount = currentContacts.length;
                const newCount = parseInt(numContacts);
                
                if (newCount > currentCount) {
                    // Add new contacts
                    for (let i = currentCount + 1; i <= newCount; i++) {
                        tempElectrodes[label][i] = {
                            contactDescription: description,
                            associatedLocation: ''
                        };
                    }
                } else if (newCount < currentCount) {
                    // Remove excess contacts
                    for (let i = newCount + 1; i <= currentCount; i++) {
                        delete tempElectrodes[label][i];
                    }
                }
                
                // Update existing contacts that used the old electrode description
                for (let i = 1; i <= Math.min(currentCount, newCount); i++) {
                    const contact = tempElectrodes[label][i];
                    
                    // For GM/GM contacts, we need to check the parts separately
                    if (contact.associatedLocation === 'GM/GM') {
                        // For GM/GM, check if either part matches the old description
                        const [desc1, desc2] = contact.contactDescription.split('+');
                        
                        if (desc1 === oldDescription) {
                            contact.contactDescription = `${description}+${desc2}`;
                        } else if (desc2 === oldDescription) {
                            contact.contactDescription = `${desc1}+${description}`;
                        }
                    }
                    // For other contact types, check if the entire description matches
                    else if (contact.contactDescription === oldDescription) {
                        if (contact.associatedLocation === 'GM') {
                            contact.contactDescription = description;
                        } else if (contact.associatedLocation === 'GM/WM') {
                            contact.contactDescription = description;
                        } else if (contact.associatedLocation === 'WM') {
                            contact.contactDescription = description;
                        } else if (contact.associatedLocation === 'OOB') {
                            contact.contactDescription = description;
                        }
                    }
                }
            } else {
                // Create a new electrode
                tempElectrodes[label] = { 
                    description: description,
                    type: electrodeType
                };
                
                // Add contacts
                for (let i = 1; i <= numContacts; i++) {
                    tempElectrodes[label][i] = {
                        contactDescription: description,
                        associatedLocation: ''
                    };
                }
            }
            
            return tempElectrodes;
        });

        // Update modification date
        setModifiedDate(new Date().toISOString());
    };

    const handleFileNameChange = (e) => {
        setFileName(e.target.value);
        setModifiedDate(new Date().toISOString());
    };

    const saveFileMetadata = async (userId) => {
        try {
            // Check if file record already exists
            const { data: existingFile } = await supabase
                .from('files')
                .select('*')
                .eq('file_id', fileId)
                .single();

            if (existingFile) {
                // Update existing file record
                const { error } = await supabase
                    .from('files')
                    .update({
                        filename: fileName,
                        modified_date: modifiedDate
                    })
                    .eq('file_id', fileId);

                if (error) throw error;
            } else {
                // Insert new file record
                const { error } = await supabase
                    .from('files')
                    .insert({
                        file_id: fileId,
                        owner_user_id: userId,
                        filename: fileName,
                        creation_date: creationDate,
                        modified_date: modifiedDate
                    });

                if (error) {
                    console.error('File insert error:', error);
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error saving file metadata:', error);
            throw error;
        }
    };

    const getUserId = async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const { data: session } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('token', token)
                .single();

            return session?.user_id || null;
        } catch (error) {
            console.error('Error fetching user ID:', error);
            return null;
        }
    };

    const handleSaveLocalization = async (download = false) => {
        try {
            // Update modified date
            const newModifiedDate = new Date().toISOString();
            setModifiedDate(newModifiedDate);
            
            // Get user ID from session
            const userId = await getUserId();
            if (!userId) {
                alert('User not authenticated. Please log in to save localizations.');
                return;
            }
            
            console.log('File ID (integer):', fileId);
            console.log('Electrodes data to save:', electrodes);
            
            // Make sure we have valid data before sending to backend
            if (Object.keys(electrodes).length === 0) {
                alert('No electrode data to save. Please add at least one electrode.');
                return;
            }
            
            try {
                // Save file metadata first
                await saveFileMetadata(userId);
                console.log('File metadata saved successfully');
            } catch (metadataError) {
                console.error('Error saving file metadata:', metadataError);
                alert(`File metadata error: ${metadataError.message}`);
                return;
            }
            
            // Prepare data for sending to backend
            const dataToSend = {
                electrodes: electrodes,
                fileId: fileId
            };
            
            console.log('Sending data to backend:', dataToSend);
            
            // Save localization data with file ID
            const response = await fetch(`${backendURL}/api/save-localization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
        
            // Get detailed error from response if possible

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to save localization: ${response.status} ${errorText}`);
            }
        
            const result = await response.json();
            console.log('Save successful:', result);

            // Save to CSV
            saveCSVFile(Identifiers.LOCALIZATION, electrodes, download);
            
            // Update tab with latest data
            onStateChange({
                expandedElectrode,
                submitFlag,
                electrodes,
                fileId,
                fileName,
                creationDate,
                modifiedDate
            });
            
            // Show success message
            alert('Localization saved successfully!');
        }
        catch (error) {
            console.error('Error saving localization:', error);
            alert(`Failed to save localization. ${error.message}`);
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
        const [selectedValue, setSelectedValue] = useState(associatedLocation);
        const [desc1, setDesc1] = useState(contactData.contactDescription?.split('+')[0] || '');
        const [desc2, setDesc2] = useState(contactData.contactDescription?.split('+')[1] || '');
        const [regionNames, setRegionNames] = useState([]);
        const [desc1Filter, setDesc1Filter] = useState('');
        const [desc2Filter, setDesc2Filter] = useState('');

        useEffect(() => {
            // Fetch region names when component mounts
            fetch(`${backendURL}/api/tables/region_name`)
                .then(response => response.json())
                .then(data => {
                    // Extract unique region names
                    setRegionNames(data.map(region => region.name));
                })
                .catch(error => {
                    console.error('Error fetching region names:', error);
                });
        }, []);

        let displayText = associatedLocation;

        if (associatedLocation === 'GM') {
            displayText = contactData.contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            displayText = `${contactData.contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [d1, d2] = contactData.contactDescription?.split('+') || ['', ''];
            displayText = `${d1}/${d2}`;
        }

        // Function to get existing region name if it exists (case-insensitive)
        const getExistingRegion = (input) => {
            const lowerInput = input.toLowerCase();
            return regionNames.find(name => name.toLowerCase() === lowerInput);
        };

        const handleSubmit = (event) => {
            event.preventDefault();
            let temp = { ...electrodes };
            
            if (selectedValue === 'GM/GM') {
                const existingDesc1 = getExistingRegion(desc1) || desc1;
                const existingDesc2 = getExistingRegion(desc2) || desc2;
                temp[label][number].contactDescription = `${existingDesc1}+${existingDesc2}`;
            } else if (selectedValue === 'GM' || selectedValue === 'GM/WM') {
                const existingDesc1 = getExistingRegion(desc1) || desc1;
                temp[label][number].contactDescription = existingDesc1;
            }
            
            temp[label][number].associatedLocation = selectedValue;
            setElectrodes(temp);
            setModifiedDate(new Date().toISOString());
            setSubmitFlag(!submitFlag);
        };

        // Filter region names based on input, case-insensitive
        const filteredRegions1 = desc1Filter
            ? regionNames.filter(name => name.toLowerCase().includes(desc1Filter.toLowerCase()))
            : regionNames;

        const filteredRegions2 = desc2Filter
            ? regionNames.filter(name => name.toLowerCase().includes(desc2Filter.toLowerCase()))
            : regionNames;

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
                nested
            >
                {close => (
                    <div className="modal bg-white p-6 rounded-lg shadow-lg">
                        <h4 className="text-lg font-semibold mb-4">Add Contact</h4>
                        <form onSubmit={handleSubmit}>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                                value={selectedValue}
                                onChange={(e) => {
                                    setSelectedValue(e.target.value);
                                    // If changing to GM, pre-fill with electrode description
                                    if (e.target.value === 'GM' && !desc1) {
                                        setDesc1(electrodes[label].description);
                                    }
                                }}
                            >
                                <option value="">Select tissue type</option>
                                {contactTypes.map((option, i) => {
                                    return (
                                        <option key={i} value={option}>{option}</option>
                                    );
                                })}
                            </select>

                            {(selectedValue === 'GM' || selectedValue === 'GM/WM') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Description
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={desc1}
                                            onChange={(e) => {
                                                setDesc1(e.target.value);
                                                setDesc1Filter(e.target.value);
                                            }}
                                            placeholder="Enter or select description"
                                            list="regions1"
                                        />
                                        <datalist id="regions1">
                                            {filteredRegions1.map((name, index) => (
                                                <option key={index} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            )}

                            {selectedValue === 'GM/GM' && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Description
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                value={desc1}
                                                onChange={(e) => {
                                                    setDesc1(e.target.value);
                                                    setDesc1Filter(e.target.value);
                                                }}
                                                placeholder="Enter or select first description"
                                                list="regions1"
                                            />
                                            <datalist id="regions1">
                                                {filteredRegions1.map((name, index) => (
                                                    <option key={index} value={name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Second Description
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                value={desc2}
                                                onChange={(e) => {
                                                    setDesc2(e.target.value);
                                                    setDesc2Filter(e.target.value);
                                                }}
                                                placeholder="Enter or select second description"
                                                list="regions2"
                                            />
                                            <datalist id="regions2">
                                                {filteredRegions2.map((name, index) => (
                                                    <option key={index} value={name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                            >
                                Done
                            </button>
                        </form>
                    </div>
                )}
            </Popup>
        );
    };

    const Electrode = ({
        name
    }) => {
        const [label, setLabel] = useState(name);
        const [showEditPopup, setShowEditPopup] = useState(false);

        const handleDelete = () => {
            setElectrodes(prevElectrodes => {
                const newElectrodes = { ...prevElectrodes };
                delete newElectrodes[label];
                return newElectrodes;
            });
            // If the deleted electrode was expanded, collapse it
            if (label === expandedElectrode) {
                setExpandedElectrode('');
            }
        };

        // Get the electrode data for editing
        const getElectrodeData = () => {
            const electrode = electrodes[label];
            
            // Create a complete electrode data object
            const electrodeData = {
                label: label,
                description: electrode.description,
                type: electrode.type || 'DIXI',
                contacts: {}
            };
            
            // Add all contact data
            Object.keys(electrode).forEach(key => {
                if (!isNaN(parseInt(key))) {
                    electrodeData.contacts[key] = electrode[key];
                }
            });
            
            return electrodeData;
        };

        return (
            <div className="w-full bg-white rounded-lg shadow-md mb-5 overflow-hidden">
                <div 
                    className="w-full flex justify-between items-center p-4 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors duration-200 relative group cursor-pointer"
                    onClick={() => {
                        if (label === expandedElectrode) {
                            setExpandedElectrode('');
                        } else {
                            setExpandedElectrode(label)
                        }
                    }}
                    key={label}>
                    <div className="text-xl">{label}</div>
                    <div className="flex items-center gap-4">
                        <div className="text-lg">{electrodes[label].description}</div>
                        <div className="flex gap-2">
                            <Popup
                                trigger={
                                    <div 
                                        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors duration-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        title="Edit electrode"
                                    >
                                        <PencilIcon className="w-4 h-4 text-white" />
                                    </div>
                                }
                                contentStyle={{ width: "500px" }}
                                modal
                                nested
                            >
                                {close => (
                                    <AddElectrodeForm
                                        close={close}
                                        addElectrode={addElectrode}
                                        submitFlag={submitFlag}
                                        setSubmitFlag={setSubmitFlag}
                                        setElectrodes={setElectrodes}
                                        editMode={true}
                                        electrodeData={getElectrodeData()}
                                    />
                                )}
                            </Popup>
                            <Popup
                                trigger={
                                    <div 
                                        className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        title="Delete electrode"
                                    >
                                        <TrashIcon className="w-4 h-4 text-white" />
                                    </div>
                                }
                                modal
                                nested
                            >
                                {close => (
                                    <div className="modal bg-white p-6 rounded-lg shadow-lg">
                                        <h4 className="text-lg font-semibold mb-4">Delete Electrode</h4>
                                        <p className="text-gray-600 mb-6">Are you sure you want to delete electrode {label}? This action cannot be undone.</p>
                                        <div className="flex justify-end gap-4">
                                            <button
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                                                onClick={close}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                                                onClick={() => {
                                                    handleDelete();
                                                    close();
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Popup>
                        </div>
                    </div>
                </div>
                {label === expandedElectrode &&
                    <div className="p-4 bg-gray-50">
                        <div className="flex gap-1 flex-wrap overflow-x-auto">
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);

                                if (!isNaN(keyNum)) {
                                    return (<Contact label={label} number={key} key={key + label} />);
                                }
                                return null;
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

    const AddElectrodeForm = ({ close, addElectrode, submitFlag, setSubmitFlag, editMode = false, electrodeData = null, setElectrodes }) => {
        // Default to DIXI if no type is provided
        const defaultType = 'DIXI';
        const [selectedElectrodeType, setSelectedElectrodeType] = useState(
            editMode && electrodeData && electrodeData.type ? electrodeData.type : defaultType
        );
        
        const electrodeOverviewData = {
            'Adtech': [4, 6, 8, 10, 12],
            'DIXI': [5, 8, 10, 12, 15, 18]
        };

        // Count the number of contacts for the electrode
        const getContactCount = (electrode) => {
            if (!electrode) {
                return 0;
            }
            
            // Check if we have a contacts object
            if (electrode.contacts) {
                // Get all contact keys from the contacts object
                const contactKeys = Object.keys(electrode.contacts);
                
                if (contactKeys.length === 0) {
                    return 0;
                }
                
                // Find the highest contact number
                const maxContact = Math.max(...contactKeys.map(key => parseInt(key)));
                return maxContact;
            }
            
            // Get all numeric keys (contact numbers)
            const contactKeys = Object.keys(electrode).filter(key => !isNaN(parseInt(key)));
            
            if (contactKeys.length === 0) {
                return 0;
            }
            
            // Find the highest contact number
            const maxContact = Math.max(...contactKeys.map(key => parseInt(key)));
            
            return maxContact;
        };

        // Ensure we have valid slider marks based on the selected type
        const getSliderMarks = (type) => {
            return electrodeOverviewData[type] || electrodeOverviewData[defaultType];
        };

        // Get the initial slider value based on whether we're editing or adding
        const getInitialSliderValue = () => {
            if (editMode && electrodeData) {
                // When editing, get the contact count from the electrode data
                const contactCount = getContactCount(electrodeData);
                return contactCount;
            } else {
                // When adding, use the first value from the slider marks
                const marks = getSliderMarks(selectedElectrodeType);
                return marks[0];
            }
        };

        const [sliderMarks, setSliderMarks] = useState(getSliderMarks(selectedElectrodeType));
        const [sliderValue, setSliderValue] = useState(getInitialSliderValue());

        const [labelInput, setLabelInput] = useState(editMode && electrodeData ? electrodeData.label || "" : "");
        const [descriptionInput, setDescriptionInput] = useState(editMode && electrodeData ? electrodeData.description || "" : "");
        const [electrodeLabelDescriptions, setElectrodeLabelDescriptions] = useState([]);
        const [hemisphere, setHemisphere] = useState("Right");
        const [showSuggestions, setShowSuggestions] = useState(false);

        // Fetch electrode label descriptions from endpoint
        useEffect(() => {
            fetch(`${backendURL}/api/electrode-label-descriptions`)
            .then(res => res.json())
            .then(data => {
                if (data && data.electrodeLabelDescriptions) {
                setElectrodeLabelDescriptions(data.electrodeLabelDescriptions);
                }
            })
            .catch(error => console.error("Error fetching electrode label descriptions:", error));
        }, []);

        // Update hemisphere based on the label input: if it ends with an apostrophe, use left; otherwise, right.
        useEffect(() => {
            if (labelInput.endsWith("'")) {
            setHemisphere("Left");
            } else {
            setHemisphere("Right");
            }
        }, [labelInput]);
    
        // Filter suggestions based on the letter portion of the label (removing any apostrophes)
        const letterPortion = labelInput.replace(/'/g, "").toUpperCase();
        const suggestions = electrodeLabelDescriptions.filter(item => item.label.toUpperCase() === letterPortion);

        useEffect(() => {
            const marks = getSliderMarks(selectedElectrodeType);
            setSliderMarks(marks);
        }, [selectedElectrodeType]);

        const handleSliderChange = (e) => {
            setSliderValue(parseInt(e.target.value, 10));
        };

        const handleInputChange = (e) => {
            let value = parseInt(e.target.value, 10);
            // Allow any positive integer value
            if (isNaN(value) || value < 1) value = 1;
            setSliderValue(value);
        };

        const minValue = Math.min(...sliderMarks);
        const maxValue = Math.max(...sliderMarks);

        const handleSubmit = (event) => {
            event.preventDefault();
            const formData = new FormData();
            formData.set("label", labelInput);
            formData.set("description", descriptionInput);
            formData.set('contacts', sliderValue);
            formData.append('electrodeType', selectedElectrodeType);
            
            if (editMode && setElectrodes) {
                // If editing, we need to handle the case where the label might have changed
                const oldLabel = electrodeData.label;
                if (oldLabel !== labelInput) {
                    // If the label changed, we need to delete the old electrode and create a new one
                    setElectrodes(prevElectrodes => {
                        const newElectrodes = { ...prevElectrodes };
                        delete newElectrodes[oldLabel];
                        return newElectrodes;
                    });
                }
            }
            
            addElectrode(formData);
            setSubmitFlag(!submitFlag);
            close();
        };

        return (
            <div className="modal bg-white p-6 rounded-lg shadow-lg">
                <h4 className="text-lg font-semibold mb-4">{editMode ? 'Edit' : 'Add'} Electrode</h4>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Electrode Label
                        </label>
                        <input
                            name="label"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="e.g., A or A'"
                            required
                        />
                    </div>
                    <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <input
                            name="description"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                            placeholder="Enter or select description"
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            required
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg z-10">
                            {suggestions.map((s, index) => (
                                <div
                                key={index}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => {
                                    setDescriptionInput(`${hemisphere} ${s.description}`);
                                    setShowSuggestions(false);
                                }}
                                >
                                {hemisphere} {s.description}
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Electrode Contacts
                        </label>
                        <div className="flex space-x-4 mb-2">
                            <button 
                                type="button" 
                                onClick={() => setSelectedElectrodeType('DIXI')}
                                className={`py-2 px-4 rounded-md ${selectedElectrodeType === 'DIXI' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                DIXI
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setSelectedElectrodeType('Adtech')}
                                className={`py-2 px-4 rounded-md ${selectedElectrodeType === 'Adtech' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                AdTech
                            </button>
                        </div>
                        <div className="flex items-center">
                            <input 
                                type="range" 
                                list="tickmarks" 
                                min={minValue} 
                                max={maxValue} 
                                step="1" 
                                value={sliderValue} 
                                onChange={handleSliderChange} 
                                className="flex-1"
                            />
                            <input 
                                type="number" 
                                min="1"
                                value={sliderValue} 
                                onChange={handleInputChange} 
                                className="ml-2 w-16 p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <datalist id="tickmarks">
                            {sliderMarks.map(mark => (
                                <option key={mark} value={mark} />
                            ))}
                        </datalist>
                        <div className="flex mt-0 relative" style={{ width: 'calc(100% - 5.625em)', marginLeft: '0.6em' }}>
                            {sliderMarks.map((mark, index) => {
                                // Calculate position as percentage
                                const position = ((mark - minValue) / (maxValue - minValue)) * 100;
                                return (
                                    <div 
                                        key={mark} 
                                        className="text-xs text-gray-500 absolute"
                                        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                                    >
                                        {mark}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <button type="submit" className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200">
                        {editMode ? 'Update' : 'Add'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="p-4">
                <div className="flex justify-between">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold">Localization</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            <div>Created: {new Date(creationDate).toLocaleString()}</div>
                            <div>Modified: {new Date(modifiedDate).toLocaleString()}</div>
                        </div>
                        <button
                            className="w-40 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded p-2"
                            onClick={() => handleSaveLocalization(false)}
                        >
                            Save
                        </button>
                        <button
                            className="w-40 bg-green-500 hover:bg-green-600 text-white font-semibold rounded p-2"
                            onClick={() => handleSaveLocalization(true)}
                        >
                            Export
                        </button>
                    </div>
                </div>
                {submitFlag ? <Electrodes /> : <Electrodes />}
            </div>
            <Container>
                <Popup
                    trigger={<Button
                            tooltip="Add a new electrode"
                            styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                            >
                            <div>+</div>
                        </Button>}
                    contentStyle={{ width: "500px" }}
                    modal
                    nested>
                    {close => (
                        <AddElectrodeForm
                            close={close}
                            addElectrode={addElectrode}
                            submitFlag={submitFlag}
                            setSubmitFlag={setSubmitFlag}
                            setElectrodes={setElectrodes}
                        />
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
