import { useState, useEffect } from 'react';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';
import { saveCSVFile, Identifiers } from '../utils/CSVParser.js';
import config from "../../config.json" with { type: 'json' };
import ViewLogsButton from '../components/localization/ViewLogsButton';
import LocalizationContact from '../components/localization/localizationContact';
import EditElectrodeModal from '../components/localization/EditElectrodeModal';
import Electrodes from '../components/localization/Electrodes';
import { useError } from '../context/ErrorContext';

const backendURL = config.backendURL;

const Localization = ({ initialData = {}, onStateChange, savedState = {}, isSharedFile = false, readOnly = false, changesData = null, highlightedChange = null, onHighlightChange = () => {}, expandedElectrode: initialExpandedElectrode = null }) => {
    const { showError } = useError();
    const [expandedElectrode, setExpandedElectrode] = useState(initialExpandedElectrode || '');
    const [submitFlag, setSubmitFlag] = useState(savedState.submitFlag || false);
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || {});
    const [fileId, setFileId] = useState(savedState.fileId || null);
    const [fileName, setFileName] = useState(savedState.fileName || 'New Localization');
    const [creationDate, setCreationDate] = useState(savedState.creationDate || new Date().toISOString());
    const [modifiedDate, setModifiedDate] = useState(savedState.modifiedDate || new Date().toISOString());
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showElectrodeModal, setShowElectrodeModal] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

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
        // Only call onStateChange if it exists and is a function
        if (typeof onStateChange === 'function') {
        onStateChange({
            expandedElectrode,
            submitFlag,
                electrodes,
                fileId,
                fileName,
                creationDate,
                modifiedDate,
                savedState.patientId // Include patientId in the state
            });
        }
    }, [expandedElectrode, submitFlag, electrodes, fileId, fileName, creationDate, modifiedDate, savedState.patientId]);

    // Generate a unique ID for the file - using integer only for database compatibility
    const generateUniqueId = () => {
        // Use timestamp as integer ID (last 9 digits to fit in int4 range)
        return Math.floor(Date.now() % 1000000000);
    };

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

    const handleContactUpdate = (label, number, updatedContact) => {
        try {
            console.log('Updating contact:', {
                label,
                number,
                updatedContact
            });

            setElectrodes(prevElectrodes => {
                const tempElectrodes = { ...prevElectrodes };
                tempElectrodes[label][number] = updatedContact;
                
                console.log('Updated electrodes state:', tempElectrodes);
            
            // If this is a shared file, check for changes immediately
            if (isSharedFile) {
                    checkForChanges(tempElectrodes);
                }
                
                return tempElectrodes;
            });
            
            setModifiedDate(new Date().toISOString());
            console.log('Contact updated successfully');
        } catch (error) {
            console.error('Error in handleContactUpdate:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            alert('Failed to update contact. Please try again.');
        }
    };

    const checkForChanges = async (currentElectrodes) => {
                    try {
                        const userId = await getUserId();
                        if (!userId) return;

                        const { data: shareData } = await supabase
                            .from('fileshares')
                            .select('current_snapshot')
                            .eq('file_id', fileId)
                            .eq('shared_with_user_id', userId)
                            .single();

                        if (shareData) {
                const changes = calculateChanges(shareData.current_snapshot, currentElectrodes);
                            setHasChanges(Object.keys(changes).length > 0);
                        }
                    } catch (error) {
                        console.error('Error checking for changes:', error);
                    }
    };

    const handleFileNameChange = (e) => {
        setFileName(e.target.value);
        setModifiedDate(new Date().toISOString());
    };

    const saveFileMetadata = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${backendURL}/api/files/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileId,
                    fileName,
                    creationDate,
                    modifiedDate,
                    savedState.patientId // Include patient_id from savedState
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save file metadata');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving file metadata:', error);
            throw error;
        }
    };

    const handleSaveLocalization = async (download = false) => {
        try {
            console.log('Starting save process...', {
                fileId,
                fileName,
                isSharedFile,
                electrodesData: electrodes
            });

            // Clean up electrodes data before sending to backend
            const cleanedElectrodes = Object.entries(electrodes).reduce((acc, [label, electrode]) => {
                // Create a clean electrode object with only the necessary fields
                const cleanElectrode = {
                    description: electrode.description,
                    type: electrode.type || 'DIXI'
                };

                // Add contacts, ensuring they're properly numbered and have the correct structure
                Object.entries(electrode).forEach(([key, value]) => {
                    if (!isNaN(parseInt(key))) {
                        cleanElectrode[key] = {
                            contactDescription: value.contactDescription || electrode.description,
                            associatedLocation: value.associatedLocation || 'WM',
                            contactNumber: parseInt(key),
                            electrodeLabel: label
                        };
                    }
                });

                acc[label] = cleanElectrode;
                return acc;
            }, {});

            // Count total contacts across all electrodes
            const totalContacts = Object.values(cleanedElectrodes).reduce((acc, electrode) => {
                const contactCount = Object.keys(electrode)
                    .filter(key => !isNaN(parseInt(key)))
                    .length;
                return acc + contactCount;
            }, 0);
            console.log(`Total contacts to save: ${totalContacts}`);

            // Update modified date
            const newModifiedDate = new Date().toISOString();
            setModifiedDate(newModifiedDate);
            
            // Get user ID from session
            const userId = await getUserId();
            console.log('Retrieved user ID:', userId);

            if (!userId) {
                console.error('No user ID found in session');
                showError('User not authenticated. Please log in to save localizations.');
                return;
            }

            // If this is a shared file, update the changed_data in fileshares
            if (isSharedFile) {
                try {
                    console.log('Handling shared file update...');
                    // Get the current share record to preserve current_snapshot
                    const { data: shareData, error: shareError } = await supabase
                        .from('fileshares')
                        .select('current_snapshot')
                        .eq('file_id', fileId)
                        .eq('shared_with_user_id', userId)
                        .single();

                    if (shareError) {
                        console.error('Error fetching share data:', shareError);
                        throw shareError;
                    }

                    console.log('Current snapshot:', shareData.current_snapshot);

                    // Calculate changes by comparing current state with snapshot
                    const changes = calculateChanges(shareData.current_snapshot, cleanedElectrodes);
                    console.log('Calculated changes:', changes);

                    if (Object.keys(changes).length > 0) {
                        // Update fileshares with changes
                        const { error: updateError } = await supabase
                            .from('fileshares')
                            .update({
                                changed_data: changes,
                                status: 'changes_suggested'
                            })
                            .eq('file_id', fileId)
                            .eq('shared_with_user_id', userId);

                        if (updateError) {
                            console.error('Error updating shared file:', updateError);
                            throw updateError;
                        }
                        console.log('Successfully updated shared file changes');
                    }
                } catch (error) {
                    console.error('Error updating shared file changes:', error);
                    showError('Failed to save changes to shared file');
                    return;
                }
            } else {
                // Regular save for non-shared files
                try {
                    console.log('Saving file metadata...');
                    await saveFileMetadata();
                    console.log('File metadata saved successfully');
                } catch (metadataError) {
                    console.error('Error saving file metadata:', metadataError);
                    showError(`File metadata error: ${metadataError.message}`);
                    return;
                }
            }

            // Prepare data for sending to backend
            const dataToSend = {
                electrodes: cleanedElectrodes,
                fileId: fileId,
                userId: userId
            };
            
            console.log('Sending data to backend:', JSON.stringify(dataToSend, null, 2));
            
            // Save localization data with file ID
            const response = await fetch(`${backendURL}/api/save-localization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
        
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to save localization: ${response.status} ${errorText}`);
            }
        
            const result = await response.json();
            console.log('Backend save response:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to save localization data');
            }

            // Verify the data was saved by fetching it back
            try {
                console.log('Verifying saved data...');
                const { data: savedData, error: fetchError } = await supabase
                    .from('localization')
                    .select('*')
                    .eq('file_id', fileId);

                if (fetchError) {
                    console.error('Error verifying saved data:', fetchError);
                } else {
                    console.log(`Verified ${savedData?.length || 0} records saved to localization table:`, savedData);
                    console.log('Expected records:', totalContacts);
                    if (savedData?.length !== totalContacts) {
                        console.error(`Mismatch in saved records! Expected ${totalContacts}, got ${savedData?.length}`);
                    }
                }
            } catch (verifyError) {
                console.error('Error verifying saved data:', verifyError);
            }

            // Save to CSV if requested
            if (download) {
                console.log('Generating CSV file...');
                saveCSVFile(Identifiers.LOCALIZATION, electrodes, true);
            }
            
            // Update tab with latest data
            onStateChange({
                expandedElectrode,
                submitFlag,
                electrodes,
                fileId,
                fileName,
                creationDate,
                modifiedDate: newModifiedDate
            });
            
            // Set hasChanges to false since we just saved
            setHasChanges(false);
            // Show success message
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
        }
        catch (error) {
            console.error('Error saving localization:', error);
            showError(`Failed to save localization. ${error.message}`);
        }
    };

    // Modify the calculateChanges function to be more consistent
    const calculateChanges = (snapshot, current) => {
        const changes = {};

        // Compare each electrode in current state with snapshot
        Object.keys(current).forEach(label => {
            const currentElectrode = current[label];
            const snapshotElectrode = snapshot[label];

            // If electrode doesn't exist in snapshot, it's a new addition
            if (!snapshotElectrode) {
                changes[label] = {
                    contacts: currentElectrode  // Changed from 'data' to 'contacts' for consistency
                };
                return;
            }

            // Compare contacts and description
            let hasChanges = false;
            const contactChanges = {};

            // Check description
            if (currentElectrode.description !== snapshotElectrode.description) {
                contactChanges.description = {
                    old: snapshotElectrode.description,
                    new: currentElectrode.description
                };
                hasChanges = true;
            }

            // Check each contact
            Object.keys(currentElectrode).forEach(key => {
                if (key === 'description') return; // Skip description as it's handled above

                const currentContact = currentElectrode[key];
                const snapshotContact = snapshotElectrode[key];

                // If contact doesn't exist in snapshot or has different values
                if (!snapshotContact || 
                    currentContact.associatedLocation !== snapshotContact.associatedLocation ||
                    currentContact.contactDescription !== snapshotContact.contactDescription) {
                    
                    contactChanges[key] = {
                        old: snapshotContact || null,
                        new: currentContact
                    };
                    hasChanges = true;
                }
            });

            // Only add to changes if there were actual changes
            if (hasChanges) {
                changes[label] = {
                    contacts: contactChanges
                };
            }
        });

        // Check for deleted electrodes
        Object.keys(snapshot).forEach(label => {
            if (!current[label]) {
                changes[label] = {
                    contacts: snapshot[label]  // Changed from 'data' to 'contacts' for consistency
                };
            }
        });

        return changes;
    };

    const createDesignationTab = async () => {
        if (Object.keys(electrodes).length === 0) return;

        try {
            // First save the localization to ensure we have the latest data
            await handleSaveLocalization(false);
            
            // Get the patient_id from the files table
            const { data: fileData, error: fileError } = await supabase
                .from('files')
                .select('patient_id')
                .eq('file_id', fileId)
                .single();

            if (fileError) {
                console.error('Error fetching patient_id:', fileError);
                return;
            }

            console.log('Creating designation tab with patientId:', {
                fromSavedState: savedState.patientId,
                fromFileData: fileData.patient_id,
                fileId: fileId
            });
            
            // Get designation data from the current localization
            const designationData = saveCSVFile(Identifiers.LOCALIZATION, electrodes, false);
            
            // Create a new tab with the designation data
            const event = new CustomEvent('addDesignationTab', {
                detail: { 
                    originalData: electrodes,
                    data: designationData,
                    localizationData: {
                        ...electrodes,
                        patientId: fileData.patient_id
                    },
                    patientId: fileData.patient_id // Pass patientId directly
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error creating designation tab:', error);
            alert('Failed to create designation tab. Please try again.');
        }
    };

    const handleApproveFile = async () => {
        try {
            // Get current user's ID
            const token = localStorage.getItem('token');
            const { data: session } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('token', token)
                .single();

            if (!session) throw new Error('No active session');

            // Remove from fileshares
            const { error: deleteError } = await supabase
                .from('fileshares')
                .delete()
                .eq('file_id', fileId)
                .eq('shared_with_user_id', session.user_id);

            if (deleteError) throw deleteError;

            // Add to approved_files
            const { error: approvedError } = await supabase
                .from('approved_files')
                .insert({
                    file_id: fileId,
                    approved_by_user_id: session.user_id,
                    approved_date: new Date().toISOString()
                });

            if (approvedError) throw approvedError;

            // Close the current tab
            const event = new CustomEvent('closeTab', {
                detail: { fileId }
            });
            window.dispatchEvent(event);

            // Refresh the To Review list
            window.dispatchEvent(new CustomEvent('refreshSharedFiles'));

        } catch (error) {
            console.error('Error approving file:', error);
            alert('Failed to approve file. Please try again.');
        }
    };

    const handleSubmitChanges = async () => {
        try {
            // Get current user's ID
            const token = localStorage.getItem('token');
            const { data: session } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('token', token)
                .single();

            if (!session) throw new Error('No active session');

            // Get the current share record
            const { data: shareData, error: shareError } = await supabase
                .from('fileshares')
                .select('current_snapshot')
                .eq('file_id', fileId)
                .eq('shared_with_user_id', session.user_id)
                .single();

            if (shareError) throw shareError;

            // Calculate changes by comparing current state with snapshot
            const changes = calculateChanges(shareData.current_snapshot, electrodes);

            // Update fileshares with changes and status
            const { error: updateError } = await supabase
                .from('fileshares')
                .update({
                    changed_data: changes,
                    status: 'changes_suggested'
                })
                .eq('file_id', fileId)
                .eq('shared_with_user_id', session.user_id);

            if (updateError) throw updateError;

            // Close the current tab
            const event = new CustomEvent('closeTab', {
                detail: { fileId }
            });
            window.dispatchEvent(event);

            // Refresh the lists
            window.dispatchEvent(new CustomEvent('refreshSharedFiles'));

            // Show success message
            alert('Changes submitted successfully!');

        } catch (error) {
            console.error('Error submitting changes:', error);
            alert('Failed to submit changes. Please try again.');
            throw error;
        }
    };

    // Add an effect to update expandedElectrode when initialExpandedElectrode changes
    useEffect(() => {
        if (initialExpandedElectrode) {
            setExpandedElectrode(initialExpandedElectrode);
        }
    }, [initialExpandedElectrode]);

    return (
        <div className="localization-container">
            <div className="header">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">Localization</h1>
                        <input
                            type="text"
                            value={fileName}
                            onChange={handleFileNameChange}
                            disabled={readOnly}
                            className="filename-input"
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
                        {showSaveSuccess && (
                            <div className="text-green-500 font-medium">
                                Save successful!
                            </div>
                        )}
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
            </div>
            </div>

            <Electrodes
                electrodes={electrodes}
                expandedElectrode={expandedElectrode}
                setExpandedElectrode={setExpandedElectrode}
                readOnly={readOnly}
                highlightedChange={highlightedChange}
                isSharedFile={isSharedFile}
                fileId={fileId}
                onHighlightChange={onHighlightChange}
                handleContactUpdate={handleContactUpdate}
                addElectrode={addElectrode}
                setSubmitFlag={setSubmitFlag}
                submitFlag={submitFlag}
                setModifiedDate={setModifiedDate}
                checkForChanges={checkForChanges}
                setElectrodes={setElectrodes}
            />

            {!readOnly && (
            <Container>
                    <Button
                        tooltip="Add Electrode"
                        styles={{ backgroundColor: darkColors.lightBlue, color: lightColors.white }}
                        onClick={() => setShowElectrodeModal(true)}
                    >
                        +
                    </Button>
                </Container>
            )}

            <EditElectrodeModal
                trigger={showElectrodeModal}
                onClose={() => setShowElectrodeModal(false)}
                onSubmit={(formData) => {
                                    addElectrode(formData);
                                    setSubmitFlag(!submitFlag);
                }}
            />

            <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                <button
                    className="py-2 px-4 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors duration-200 shadow-lg"
                    onClick={createDesignationTab}
                >
                    Open in Designation
                </button>

                {isSharedFile && (
                    <button
                        onClick={() => setShowApprovalModal(true)}
                        className={`py-2 px-4 font-bold rounded-md transition-colors duration-200 shadow-lg ${
                            hasChanges 
                                ? "bg-violet-600 hover:bg-violet-700 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                        {hasChanges ? 'Submit Changes' : 'Approve File'}
                    </button>
                )}
            </div>

            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {hasChanges ? 'Submit Changes' : 'Approve File'}
                        </h2>
                        <p className="mb-6 text-gray-600">
                            {hasChanges 
                                ? 'Are you done suggesting changes to this file? The owner will be notified of your suggestions.'
                                : 'Once you approve this file, you will not be able to view or suggest changes unless the owner shares it with you again.'}
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowApprovalModal(false);
                                    if (hasChanges) {
                                        await handleSubmitChanges();
                                    } else {
                                        await handleApproveFile();
                                    }
                                }}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                {hasChanges ? 'Submit' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Localization;
