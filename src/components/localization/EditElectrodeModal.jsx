import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import ErrorMessage from '../ErrorMessage';
import { useWarning } from '../../context/WarningContext';

const backendURL = __APP_CONFIG__.backendURL;

const EditElectrodeModal = ({ 
    trigger,
    onClose, 
    onSubmit, 
    initialData = null,
    isEditMode = false,
    setElectrodes = null
}) => {
    const { showWarning } = useWarning();

    // Default to DIXI if no type is provided
    const defaultType = 'DIXI';
    const [selectedElectrodeType, setSelectedElectrodeType] = useState(
        isEditMode && initialData && initialData.type ? initialData.type : defaultType
    );
    
    const electrodeOverviewData = {
        'AD-TECH': [4, 6, 8, 10, 12],
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

    // Get the initial slider value based on whether we're editing or adding
    const getInitialSliderValue = () => {
        if (isEditMode && initialData) {
            // When editing, get the contact count from the electrode data
            const contactCount = getContactCount(initialData);
            return contactCount;
        } else {
            // When adding, use the first value from the slider marks
            const marks = electrodeOverviewData[selectedElectrodeType];
            return marks[0];
        }
    };

    const [sliderValue, setSliderValue] = useState(getInitialSliderValue().toString());
    const [labelInput, setLabelInput] = useState(isEditMode && initialData ? initialData.label || "" : "");
    const [descriptionInput, setDescriptionInput] = useState(isEditMode && initialData ? initialData.description || "" : "");
    const [electrodeLabelDescriptions, setElectrodeLabelDescriptions] = useState([]);
    const [hemisphere, setHemisphere] = useState("Right");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [descriptionEdited, setDescriptionEdited] = useState(false);
    const [descDropdownOpen, setDescDropdownOpen] = useState(false);
    const [error, setError] = useState("");
    const [contactsEdited, setContactsEdited] = useState(false);

    // Fetch electrode label descriptions from endpoint
    useEffect(() => {
        fetch(`${backendURL}/api/electrode-label-descriptions`)
        .then(res => res.json())
        .then(data => {
            if (data && data.electrodeLabelDescriptions) {
                setElectrodeLabelDescriptions(data.electrodeLabelDescriptions);
            }
        })
        .catch(error => {
            console.error("Error fetching electrode label descriptions:", error)
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. Make sure to download your progress.");
            }
        });
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

    // Update description when a suggestion is found
    useEffect(() => {
        if (isEditMode && showSuggestions && suggestions.length > 0) {
            const suggestedDescription = `${hemisphere} ${suggestions[0].description}`;
            setDescriptionInput(suggestedDescription);
        }
    }, [isEditMode, showSuggestions, suggestions, hemisphere]);

    useEffect(() => {
        setDescriptionEdited(false);
        setContactsEdited(false);
    }, [labelInput]);

    useEffect(() => {
        if (!descriptionEdited && suggestions.length > 0) {
            setDescriptionInput(`${hemisphere} ${suggestions[0].description}`);
        }
    }, [labelInput, hemisphere, suggestions]);

    useEffect(() => {
        if (trigger && !isEditMode) {
            setLabelInput("");
            setDescriptionInput("");
            setSliderValue("4"); // default to 4 for DIXI
            setSelectedElectrodeType("DIXI");
            setDescriptionEdited(false);
            setContactsEdited(false);
            setShowSuggestions(false);
            setDescDropdownOpen(false);
            setError("");
        }
    }, [trigger, isEditMode]);

    const handleSliderChange = (e) => {
        setSliderValue(e.target.value);
        setContactsEdited(true);
    };

    const handleInputChange = (e) => {
        setSliderValue(e.target.value);
        setContactsEdited(true);
    };

    // Always use 1 to 20 for slider
    const minValue = 1;
    const maxValue = 20;
    const sliderMarks = Array.from({ length: 20 }, (_, i) => i + 1);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isEditMode && labelInput.trim() === "") {
            setError("Electrode label cannot be blank.");
            return;
        }
        if (sliderValue.trim() === "" || isNaN(Number(sliderValue)) || Number(sliderValue) <= 0) {
            setError("Number of contacts must be a positive integer.");
            return;
        }
        const formData = new FormData();
        formData.set("label", labelInput);
        formData.set("description", descriptionInput);
        formData.set('contacts', sliderValue);
        formData.append('electrodeType', selectedElectrodeType);
        
        if (isEditMode && setElectrodes) {
            // If editing, we need to handle the case where the label might have changed
            const oldLabel = initialData.label;
            if (oldLabel !== labelInput) {
                // If the label changed, we need to delete the old electrode and create a new one
                setElectrodes(prevElectrodes => {
                    const newElectrodes = { ...prevElectrodes };
                    delete newElectrodes[oldLabel];
                    return newElectrodes;
                });
            }
        }
        
        onSubmit(formData);
        onClose();
    };

    return (
        <Popup
            open={trigger}
            onClose={onClose}
            modal
            nested
        >
            {close => (
                <div className="modal bg-white p-6 rounded-lg shadow-lg">
                    {error && <ErrorMessage message={error} onClose={() => setError("")} />}
                    <h4 className="text-lg font-semibold mb-4">
                        {isEditMode ? 'Edit Electrode' : 'Add Electrode'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor='electrodeLabel'>
                                Electrode Label
                            </label>
                            <input 
                                type="text"
                                value={labelInput}
                                onChange={(e) => {
                                    setLabelInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                name='electrodeLabel'
                                id='electrodeLabel'
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-600">
                                        {hemisphere} {suggestions[0].description}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mb-4 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor='electrodeDescription'>
                                Description
                            </label>
                            <input 
                                type="text"
                                name='electrodeDescription'
                                id='electrodeDescription'
                                value={descriptionInput}
                                onChange={(e) => {
                                    setDescriptionInput(e.target.value);
                                    setDescriptionEdited(true);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                onFocus={() => setDescDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setDescDropdownOpen(false), 100)}
                            />
                            {descDropdownOpen && (
                                <div className="absolute z-50 bg-white border border-gray-300 rounded shadow max-h-40 overflow-y-auto w-full">
                                    {electrodeLabelDescriptions
                                        .filter(item => item.label.toUpperCase() === letterPortion)
                                        .map((item, idx) => {
                                            const option = `${hemisphere} ${item.description}`;
                                            return (
                                                <div
                                                    key={option + idx}
                                                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                                                    onMouseDown={() => {
                                                        setDescriptionInput(option);
                                                        setDescriptionEdited(true);
                                                        setDescDropdownOpen(false);
                                                    }}
                                                >
                                                    {option}
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor='electrodeType'>
                                Electrode Type
                            </label>
                            <select
                                name='electrodeType'
                                id='electrodeType'
                                value={selectedElectrodeType}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedElectrodeType(val);
                                    if (!contactsEdited) {
                                        if (val === 'DIXI') setSliderValue('4');
                                        else if (val === 'AD-TECH') setSliderValue('5');
                                    }
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="DIXI">DIXI</option>
                                <option value="AD-TECH">AD-TECH</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor='electrodeNumContacts'>
                                Number of Contacts
                            </label>
                            <div>
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex-1 relative">
                                        <input
                                            type="range"
                                            name='electrodeNumContacts'
                                            id='electrodeNumContacts'
                                            min={minValue}
                                            max={maxValue}
                                            step={1}
                                            value={sliderValue === "" ? minValue : Math.max(minValue, Math.min(maxValue, Number(sliderValue)))}
                                            onChange={handleSliderChange}
                                            className="w-full"
                                            list="contact-marks"
                                            style={{ backgroundSize: '100% 2px' }}
                                        />
                                        <div
                                            className="absolute left-0 right-0 -bottom-5 grid"
                                            style={{
                                                gridTemplateColumns: 'repeat(20, 1fr)',
                                                width: '100%',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {sliderMarks.map(mark => (
                                                <span key={mark} className="text-center text-xs text-gray-500" style={{ pointerEvents: 'none' }}>{mark}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        value={sliderValue}
                                        onChange={handleInputChange}
                                        className="w-20 p-2 border border-gray-300 rounded-md"
                                    />
                                    <datalist id="contact-marks">
                                        {sliderMarks.map(mark => (
                                            <option key={mark} value={mark} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                        >
                            {isEditMode ? 'Update' : 'Add'}
                        </button>
                    </form>
                </div>
            )}
        </Popup>
    );
};

export default EditElectrodeModal; 
