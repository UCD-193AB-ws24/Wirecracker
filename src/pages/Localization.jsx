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
                patientId : savedState.patientId // Include patientId in the state
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
            showError('Failed to update contact. Please try again.');
        }
    };

    const checkForChanges = async (currentElectrodes) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${backendURL}/api/logs/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch file logs');
            }

            const logs = await response.json();
            const latestSnapshot = logs.find(log => log.type === 'changes')?.snapshot;

            if (latestSnapshot) {
                const changes = calculateChanges(latestSnapshot, currentElectrodes);
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
                    patientId : savedState.patientId // Include patient_id from savedState
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

            // If this is a shared file, update the changed_data in fileshares
            if (isSharedFile) {
                try {
                    console.log('Handling shared file update...');
                    // Get the current share record to preserve current_snapshot
                    const logsResponse = await fetch(`${backendURL}/api/logs/${fileId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!logsResponse.ok) {
                        throw new Error('Failed to fetch file logs');
                    }

                    const logs = await logsResponse.json();
                    const latestSnapshot = logs.find(log => log.type === 'changes')?.snapshot;

                    console.log('Current snapshot:', latestSnapshot);

                    // Calculate changes by comparing current state with snapshot
                    const changes = calculateChanges(latestSnapshot, cleanedElectrodes);
                    console.log('Calculated changes:', changes);

                    if (Object.keys(changes).length > 0) {
                        // Update fileshares with changes
                        const updateResponse = await fetch(`${backendURL}/api/submit-changes/${fileId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ changes })
                        });

                        if (!updateResponse.ok) {
                            throw new Error('Failed to update shared file');
                        }
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
                fileId: fileId
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

            // Save to CSV if requested
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
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${backendURL}/api/files/patient/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch patient ID');
            }

            const { patientId } = await response.json();
            
            console.log('Creating designation tab with patientId:', {
                fromSavedState: savedState.patientId,
                fromFileData: patientId,
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
                        patientId: patientId
                    },
                    patientId: patientId // Pass patientId directly
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error creating designation tab:', error);
            showError('Failed to create designation tab. Please try again.');
        }
    };

    const handleApproveFile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Remove from fileshares and add to approved_files
            const response = await fetch(`${backendURL}/api/approve/${fileId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve file');
            }

            // Close the current tab
            const event = new CustomEvent('closeTab', {
                detail: { fileId }
            });
            window.dispatchEvent(event);

            // Refresh the To Review list
            window.dispatchEvent(new CustomEvent('refreshSharedFiles'));

        } catch (error) {
            console.error('Error approving file:', error);
            showError('Failed to approve file. Please try again.');
        }
    };

    const handleSubmitChanges = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get the current share record
            const logsResponse = await fetch(`${backendURL}/api/logs/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!logsResponse.ok) {
                throw new Error('Failed to fetch file logs');
            }

            const logs = await logsResponse.json();
            const latestSnapshot = logs.find(log => log.type === 'changes')?.snapshot;

            // Calculate changes by comparing current state with snapshot
            const changes = calculateChanges(latestSnapshot, electrodes);

            // Submit changes
            const submitResponse = await fetch(`${backendURL}/api/submit-changes/${fileId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ changes })
            });

            if (!submitResponse.ok) {
                throw new Error('Failed to submit changes');
            }

            // Close the current tab
            const event = new CustomEvent('closeTab', {
                detail: { fileId }
            });
            window.dispatchEvent(event);

            // Refresh the lists
            window.dispatchEvent(new CustomEvent('refreshSharedFiles'));

            // Show success message
            console.log('Changes submitted successfully!');

        } catch (error) {
            console.error('Error submitting changes:', error);
            showError('Failed to submit changes. Please try again.');
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
                <div className="flex justify-between items-center w-full p-2 md:p-3 lg:p-4 xl:p-6">
                    <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                        <h1 className="text-2xl font-bold">Localization</h1>
                        <input
                            type="text"
                            value={fileName}
                            onChange={handleFileNameChange}
                            disabled={readOnly}
                            className="filename-input"
                        />
                    </div>
                    
                        <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                        {!readOnly && (
                            <>
                            <div className="text-xs lg:text-sm text-gray-600">
                                <div>Created: {new Date(creationDate).toLocaleString()}</div>
                                <div>Modified: {new Date(modifiedDate).toLocaleString()}</div>
                            </div>
                            {showSaveSuccess && (
                                <div className="text-green-500 text-sm lg:text-base font-medium">
                                    Save successful!
                                </div>
                            )}
                            <button
                                className="w-20 border border-sky-800 bg-sky-600 text-white text-sm font-semibold rounded p-1
                                           transition-colors duration-200 cursor-pointer hover:bg-sky-800
                                           md:w-26
                                           lg:w-32 lg:text-base lg:p-2
                                           xl:w-40"
                                onClick={() => handleSaveLocalization(false)}
                            >
                                Save
                            </button>
                    <button
                                className="w-20 border border-green-600 bg-green-500 text-white text-sm font-semibold rounded p-1
                                           transition-colors duration-200 cursor-pointer hover:bg-green-600
                                           md:w-26
                                           lg:w-32 lg:text-base lg:p-2
                                           xl:w-40"
                                onClick={() => handleSaveLocalization(true)}
                    >
                                Export
                    </button>
                            </>
                        )}
                        {isSharedFile && (
                            <div className="shared-file-controls">
                                <ViewLogsButton
                                    fileId={fileId}
                                    highlightedChange={highlightedChange}
                                    onHighlightChange={onHighlightChange}
                                />
                                {hasChanges && (
                                    <button onClick={() => setShowApprovalModal(true)} className="submit-changes-btn">
                                        Submit Changes
                                    </button>
                                )}
                        </div>
                    )}
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

            <div className="fixed bottom-2 right-2 z-50 flex gap-1
                            lg:bottom-6 lg:right-6 lg:gap-2">
                <button
                    className="py-1 px-2 bg-green-500 text-white font-semibold rounded-md shadow-lg
                               transition-colors duration-200 cursor-pointer hover:bg-green-600
                               lg:py-2 lg:px-4"
                    onClick={createDesignationTab}
                >
                    Open in Designation
                </button>

                {isSharedFile && (
                    <button
                        onClick={() => setShowApprovalModal(true)}
                        className={`py-1 px-2 border text-white font-semibold rounded-md transition-colors duration-200 shadow-lg
                                    lg:py-2 lg:px-4 cursor-pointer
                                    ${hasChanges 
                                        ? "border-violet-600 bg-violet-500 hover:bg-violet-600"
                                        : "border-green-600 bg-green-500 hover:bg-green-600"
                                    }`}
                    >
                        {hasChanges ? 'Submit Changes' : 'Approve File'}
                    </button>
                )}
            </div>

            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
                    <div className="bg-white p-3 lg:p-6 rounded-lg shadow-xl max-w-md">
                        <h2 className="text-base font-bold mb-2
                                       lg:text-xl lg:mb-4">
                            {hasChanges ? 'Submit Changes' : 'Approve File'}
                        </h2>
                        <p className="mb-3 lg:mb-6 text-gray-600">
                            {hasChanges 
                                ? 'Are you done suggesting changes to this file? The owner will be notified of your suggestions.'
                                : 'Once you approve this file, you will not be able to view or suggest changes unless the owner shares it with you again.'}
                        </p>
                        <div className="flex justify-end gap-2 lg:gap-4">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="px-2 py-1 text-gray-600 hover:text-gray-800
                                           lg:px-4 lg:py-2"
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
                                className="px-3 py-1 border border-green-600 bg-green-500 text-white rounded hover:bg-green-600
                                           lg:px-6 lg:py-2"
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
