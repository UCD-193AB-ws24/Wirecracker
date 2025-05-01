import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import config from "../../../config.json" with { type: 'json' };

const backendURL = config.backendURL;

const LocalizationContact = ({
    label,
    number,
    isHighlighted,
    readOnly,
    contactData,
    onContactUpdate,
    isSharedFile,
    fileId,
    onHighlightChange
}) => {
    const [selectedValue, setSelectedValue] = useState(contactData.associatedLocation);
    const [desc1, setDesc1] = useState(contactData.contactDescription?.split('+')[0] || '');
    const [desc2, setDesc2] = useState(contactData.contactDescription?.split('+')[1] || '');
    const [regionNames, setRegionNames] = useState([]);
    const [desc1Filter, setDesc1Filter] = useState('');
    const [desc2Filter, setDesc2Filter] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    // Add debug logging for showPopup state changes
    useEffect(() => {
        console.log('Modal state changed:', { showPopup, label, number });
    }, [showPopup, label, number]);

    useEffect(() => {
        // Fetch region names when component mounts
        fetch(`${backendURL}/api/tables/region_name`)
            .then(response => response.json())
            .then(data => {
                // Extract unique region names
                const names = data.map(region => region.name);
                setRegionNames(names);
                
                // Auto-fill region based on electrode label if no description exists
                if (!contactData.contactDescription) {
                    // Extract the anatomical region from the electrode label
                    // Assuming format like "LA" for "left Anterior"
                    let suggestedRegion = '';
                    
                    if (label.startsWith('L') || label.startsWith('l')) {
                        suggestedRegion = 'left ';
                    } else if (label.startsWith('R') || label.startsWith('r')) {
                        suggestedRegion = 'right ';
                    }
                    
                    // Map common electrode abbreviations to full names
                    const regionMap = {
                        'A': 'Anterior',
                        'P': 'Posterior',
                        'M': 'Medial',
                        'L': 'Lateral',
                        'H': 'Hippocampus',
                        'OF': 'Orbitofrontal',
                        'T': 'Temporal'
                        // Add more mappings as needed
                    };
                    
                    // Get the region part of the label (after L/R)
                    const regionPart = label.substring(1);
                    
                    // Try to match with the region map
                    const matchedRegion = regionMap[regionPart] || '';
                    if (matchedRegion) {
                        suggestedRegion += matchedRegion;
                        
                        // Find the closest matching region name
                        const exactMatch = names.find(name => 
                            name.toLowerCase() === suggestedRegion.toLowerCase()
                        );
                        
                        if (exactMatch) {
                            setDesc1(exactMatch);
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching region names:', error);
            });
    }, [label, contactData.contactDescription]);

    let displayText = contactData.associatedLocation;

    if (contactData.associatedLocation === 'GM') {
        displayText = contactData.contactDescription;
    } else if (contactData.associatedLocation === 'GM/WM') {
        displayText = `${contactData.contactDescription}/WM`;
    } else if (contactData.associatedLocation === 'GM/GM') {
        const [d1, d2] = contactData.contactDescription?.split('+') || ['', ''];
        displayText = `${d1}/${d2}`;
    }

    // Function to get existing region name if it exists (case-insensitive)
    const getExistingRegion = (input) => {
        const lowerInput = input.toLowerCase();
        return regionNames.find(name => name.toLowerCase() === lowerInput);
    };

    // Filter region names based on input, case-insensitive
    const filteredRegions1 = desc1Filter
        ? regionNames.filter(name => name.toLowerCase().includes(desc1Filter.toLowerCase()))
        : regionNames;

    const filteredRegions2 = desc2Filter
        ? regionNames.filter(name => name.toLowerCase().includes(desc2Filter.toLowerCase()))
        : regionNames;

    const contactTypes = ['GM', 'GM/GM', 'GM/WM', 'WM', 'OOB'];

    return (
        <Popup
            trigger={
                <button
                    className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-colors duration-200 min-w-[100px] ${
                        isHighlighted 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-300 hover:bg-gray-100'
                    }`}
                    key={number}
                    onClick={() => {
                        console.log('Contact button clicked:', { label, number, readOnly });
                        if (!readOnly) {
                            setShowPopup(true);
                        }
                    }}
                >
                    <div className="text-sm font-medium text-gray-700 w-20 h-5">{number}</div>
                    <div className="text-xs text-gray-500 w-20 h-15">{displayText}</div>
                </button>
            }
            open={showPopup}
            onClose={() => {
                console.log('Popup onClose triggered');
                setShowPopup(false);
            }}
            modal
            nested
            disabled={readOnly}
            closeOnDocumentClick
            closeOnEscape
        >
            <div className="modal bg-white p-6 rounded-lg shadow-lg">
                <button 
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                        console.log('Close button clicked');
                        setShowPopup(false);
                    }}
                    type="button"
                >
                    ×
                </button>
                <h4 className="text-lg font-semibold mb-4">
                    Edit Contact {number}
                </h4>
                <form onSubmit={(e) => {
                    console.log('Form submission started');
                    e.preventDefault();
                    let updatedContact = { ...contactData };
                    
                    if (selectedValue === 'GM/GM') {
                        const existingDesc1 = getExistingRegion(desc1) || desc1;
                        const existingDesc2 = getExistingRegion(desc2) || desc2;
                        updatedContact.contactDescription = `${existingDesc1}+${existingDesc2}`;
                    } else if (selectedValue === 'GM' || selectedValue === 'GM/WM') {
                        const existingDesc1 = getExistingRegion(desc1) || desc1;
                        updatedContact.contactDescription = existingDesc1;
                    }
                    
                    updatedContact.associatedLocation = selectedValue;
                    console.log('Updating contact:', { label, number, updatedContact });
                    onContactUpdate(label, number, updatedContact);
                    console.log('Contact updated, attempting to close modal');
                    setShowPopup(false);
                    console.log('Modal close command sent');
                }}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location Type
                        </label>
                        <select
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Select type...</option>
                            {contactTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {(selectedValue === 'GM' || selectedValue === 'GM/WM') && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Region
                            </label>
                            <input
                                type="text"
                                value={desc1}
                                onChange={(e) => {
                                    setDesc1(e.target.value);
                                    setDesc1Filter(e.target.value);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                list="regions1"
                            />
                            <datalist id="regions1">
                                {filteredRegions1.map(name => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>
                        </div>
                    )}

                    {selectedValue === 'GM/GM' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Second Region
                            </label>
                            <input
                                type="text"
                                value={desc2}
                                onChange={(e) => {
                                    setDesc2(e.target.value);
                                    setDesc2Filter(e.target.value);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                list="regions2"
                            />
                            <datalist id="regions2">
                                {filteredRegions2.map(name => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                        Save
                    </button>
                </form>
            </div>
        </Popup>
    );
};

export default LocalizationContact;