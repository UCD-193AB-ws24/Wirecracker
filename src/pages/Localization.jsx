import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';
import { saveCSVFile, Identifiers } from '../utils/CSVParser.js';
import { supabase } from '../utils/supabaseClient';
import config from "../../config.json" with { type: 'json' };
import ShareButton from '../components/ShareButton';

const backendURL = config.backendURL;

const ViewLogsButton = ({ fileId, onHighlightChange }) => {
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState([]);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [selectedChange, setSelectedChange] = useState(null);
    const [currentHighlight, setCurrentHighlight] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Get approvals
                const { data: approvals } = await supabase
                    .from('approved_files')
                    .select(`
                        approved_date,
                        approved_by:approved_by_user_id(name)
                    `)
                    .eq('file_id', fileId);

                // Get suggested changes
                const { data: suggestions } = await supabase
                    .from('fileshares')
                    .select(`
                        shared_date,
                        changed_data,
                        current_snapshot,
                        shared_with:shared_with_user_id(name),
                        status
                    `)
                    .eq('file_id', fileId)
                    .eq('status', 'changes_suggested');

                const allLogs = [
                    ...(approvals?.map(a => ({
                        type: 'approval',
                        date: a.approved_date,
                        user: a.approved_by?.name,
                        message: `File approved by: ${a.approved_by?.name}`
                    })) || []),
                    ...(suggestions?.map(s => ({
                        type: 'changes',
                        date: s.shared_date,
                        user: s.shared_with?.name,
                        message: `Changes suggested by: ${s.shared_with?.name}`,
                        changes: s.changed_data,
                        snapshot: s.current_snapshot
                    })) || [])
                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                setLogs(allLogs);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };

        fetchLogs();
    }, [fileId]);

    const handleViewChanges = (log) => {
        setSelectedChange(log);
        setShowChangesModal(true);
    };

    const handleHighlight = (label, key) => {
        setCurrentHighlight({ label, key });
        onHighlightChange(label, key);
    };

    return (
        <>
            <button
                onClick={() => setShowLogs(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
                View Logs
            </button>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">File Logs</h2>
                            <button
                                onClick={() => setShowLogs(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-gray-500">No logs to show</p>
                            ) : (
                                logs.map((log, index) => (
                                    <div 
                                        key={index} 
                                        className="flex justify-between items-center p-2 border rounded"
                                    >
                                        <div>
                                            <p>{log.message}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(log.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {log.type === 'changes' && (
                                            <button
                                                onClick={() => handleViewChanges(log)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Changes View Modal */}
            {showChangesModal && selectedChange && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full h-[80vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Suggested Changes</h2>
                            <div className="flex items-center gap-4">
                                <Popup
                                    trigger={
                                        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600">
                                            View Changes
                                        </button>
                                    }
                                    position="bottom right"
                                    closeOnDocumentClick
                                    contentStyle={{
                                        width: '300px',
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-lg mb-2">Changes Made</h3>
                                        {Object.entries(selectedChange.changes).map(([label, change]) => {
                                            // Check if this is a new electrode (no old/new structure)
                                            const isNewElectrode = change.contacts && 
                                                !Object.values(change.contacts)[0].hasOwnProperty('old');
                                            
                                            if (isNewElectrode) {
                                                // Count the number of contacts (excluding the description field)
                                                const contactCount = Object.keys(change.contacts).filter(key => key !== 'description').length;
                                                return (
                                                    <div key={label} className="border-b pb-2">
                                                        <div 
                                                            className="text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                                            onClick={() => handleHighlight(label, null)}
                                                        >
                                                            New Electrode {label} added with {contactCount} contacts
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Handle modified electrodes
                                            return (
                                                <div key={label} className="border-b pb-2">
                                                    <h4 className="font-semibold">{label}</h4>
                                                    {change.contacts && Object.entries(change.contacts).map(([key, value]) => {
                                                        if (key === 'description') {
                                                            return (
                                                                <div 
                                                                    key={`${label}-${key}`}
                                                                    className="text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                                                    onClick={() => handleHighlight(label, key)}
                                                                >
                                                                    Description changed: {value.old} → {value.new}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div 
                                                                key={`${label}-${key}`}
                                                                className="text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                                                onClick={() => handleHighlight(label, key)}
                                                            >
                                                                Contact {key}: {value.old?.associatedLocation || 'None'} 
                                                                {value.old?.contactDescription ? ` (${value.old.contactDescription})` : ''} → 
                                                                {value.new?.associatedLocation}
                                                                {value.new?.contactDescription ? ` (${value.new.contactDescription})` : ''}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Popup>
                                <button
                                    onClick={() => {
                                        setShowChangesModal(false);
                                        onHighlightChange(null, null); // Clear highlight when closing modal
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <Localization 
                                initialData={{ 
                                    data: applyChangesToSnapshot(
                                        selectedChange.snapshot, 
                                        selectedChange.changes
                                    )
                                }}
                                readOnly={true}
                                onStateChange={() => {}}
                                changesData={selectedChange.changes}
                                highlightedChange={currentHighlight}
                                expandedElectrode={currentHighlight?.label}
                                initialExpandedElectrode={currentHighlight?.label}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Add this utility function to apply changes to the snapshot
const applyChangesToSnapshot = (snapshot, changes) => {
    const modifiedSnapshot = { ...snapshot };
    
    Object.entries(changes).forEach(([label, change]) => {
        if (change.contacts) {
            // Handle new electrodes
            if (!modifiedSnapshot[label]) {
                modifiedSnapshot[label] = change.contacts;
            } else {
                // Handle modified contacts
                Object.entries(change.contacts).forEach(([key, value]) => {
                    if (key === 'description') {
                        modifiedSnapshot[label].description = value.new;
                    } else {
                        modifiedSnapshot[label][key] = value.new;
                    }
                });
            }
        }
    });
    
    return modifiedSnapshot;
};

const Localization = ({ initialData = {}, onStateChange, savedState = {}, isSharedFile = false, readOnly = false, changesData = null, highlightedChange = null, onHighlightChange = () => {}, expandedElectrode: initialExpandedElectrode = null }) => {
    const [expandedElectrode, setExpandedElectrode] = useState(initialExpandedElectrode || '');
    const [submitFlag, setSubmitFlag] = useState(savedState.submitFlag || false);
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || {});
    const [fileId, setFileId] = useState(savedState.fileId || null);
    const [fileName, setFileName] = useState(savedState.fileName || 'New Localization');
    const [creationDate, setCreationDate] = useState(savedState.creationDate || new Date().toISOString());
    const [modifiedDate, setModifiedDate] = useState(savedState.modifiedDate || new Date().toISOString());
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

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
                modifiedDate
            });
        }
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
        
        setElectrodes(prevElectrodes => {
            const tempElectrodes = { ...prevElectrodes };
            tempElectrodes[label] = { description: description };
            for (let i = 1; i <= numContacts; i++) {
                tempElectrodes[label][i] = { 
                    contactDescription: description, 
                    associatedLocation: '' 
                };
            }
            
            // If this is a shared file, check for changes immediately
            if (isSharedFile) {
                // We need to use the new state (tempElectrodes) here
                (async () => {
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
                            const changes = calculateChanges(shareData.current_snapshot, tempElectrodes);
                            setHasChanges(Object.keys(changes).length > 0);
                        }
                    } catch (error) {
                        console.error('Error checking for changes:', error);
                    }
                })();
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

            // If this is a shared file, update the changed_data in fileshares
            if (isSharedFile) {
                try {
                    // Get the current share record to preserve current_snapshot
                    const { data: shareData, error: shareError } = await supabase
                        .from('fileshares')
                        .select('current_snapshot')
                        .eq('file_id', fileId)
                        .eq('shared_with_user_id', userId)
                        .single();

                    if (shareError) throw shareError;

                    // Calculate changes by comparing current state with snapshot
                    const changes = calculateChanges(shareData.current_snapshot, electrodes);

                    if (Object.keys(changes).length > 0) {
                        // Update fileshares with changes
                        const { error: updateError } = await supabase
                            .from('fileshares')
                            .update({
                                changed_data: changes
                            })
                            .eq('file_id', fileId)
                            .eq('shared_with_user_id', userId);

                        if (updateError) throw updateError;
                    }
                } catch (error) {
                    console.error('Error updating shared file changes:', error);
                    alert('Failed to save changes to shared file');
                    return;
                }
            } else {
                // Regular save for non-shared files
                try {
                    await saveFileMetadata(userId);
                    console.log('File metadata saved successfully');
                } catch (metadataError) {
                    console.error('Error saving file metadata:', metadataError);
                    alert(`File metadata error: ${metadataError.message}`);
                    return;
                }
            }

            // Save to CSV if requested
            if (download) {
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
                modifiedDate
            });
            
            alert('Localization saved successfully!');
        } catch (error) {
            console.error('Error saving localization:', error);
            alert(`Failed to save localization. ${error.message}`);
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

    const Contact = ({
        label,
        number,
        isHighlighted
    }) => {
        const contactData = electrodes[label][number];
        const associatedLocation = contactData.associatedLocation;
        const [selectedValue, setSelectedValue] = useState(associatedLocation);
        const [desc1, setDesc1] = useState(contactData.contactDescription?.split('+')[0] || '');
        const [desc2, setDesc2] = useState(contactData.contactDescription?.split('+')[1] || '');
        const [regionNames, setRegionNames] = useState([]);
        const [desc1Filter, setDesc1Filter] = useState('');
        const [desc2Filter, setDesc2Filter] = useState('');
        const [showPopup, setShowPopup] = useState(false);

        useEffect(() => {
            // Fetch region names when component mounts
            fetch('http://localhost:5000/api/tables/region_name')
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
            
            // Check for changes if this is a shared file
            if (isSharedFile) {
                checkForChanges(temp);
            }
            
                                setSubmitFlag(!submitFlag);
                                close();
        };

        // Filter region names based on input, case-insensitive
        const filteredRegions1 = desc1Filter
            ? regionNames.filter(name => name.toLowerCase().includes(desc1Filter.toLowerCase()))
            : regionNames;

        const filteredRegions2 = desc2Filter
            ? regionNames.filter(name => name.toLowerCase().includes(desc2Filter.toLowerCase()))
            : regionNames;

        // Add a function to check for changes
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

        // Add effect to check for changes when component mounts
        useEffect(() => {
            if (isSharedFile) {
                checkForChanges(electrodes);
            }
        }, []);

        const isHighlightedContact = highlightedChange && 
            highlightedChange.label === label && 
            (highlightedChange.key === number || highlightedChange.key === null);

        return (
            <Popup
                trigger={
                    <button
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-colors duration-200 min-w-[100px] ${
                            isHighlightedContact 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-300 hover:bg-gray-100'
                        }`}
                        key={number}
                        onClick={() => !readOnly && setShowPopup(true)}
                    >
                        <div className="text-sm font-medium text-gray-700 w-20 h-5">{number}</div>
                        <div className="text-xs text-gray-500 w-20 h-15">{displayText}</div>
                    </button>
                }
                open={showPopup}
                onClose={() => setShowPopup(false)}
                modal
                nested
                disabled={readOnly} // Disable popup in read-only mode
            >
                {close => (
                    <div className="modal bg-white p-6 rounded-lg shadow-lg">
                        <h4 className="text-lg font-semibold mb-4">
                            Edit Contact {number}
                        </h4>
                        <form onSubmit={handleSubmit}>
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
                )}
            </Popup>
        );
    };

    const Electrode = ({
        name
    }) => {
        const [label, setLabel] = useState(name);
        const isHighlighted = highlightedChange && 
            highlightedChange.label === label && 
            highlightedChange.key === null;

        return (
            <div className={`w-full bg-white rounded-lg shadow-md mb-5 overflow-hidden ${
                isHighlighted ? 'ring-2 ring-blue-500' : ''
            }`}>
                <button
                    className={`w-full flex justify-between items-center p-4 ${
                        isHighlighted 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-blue-500 text-white'
                    } font-semibold hover:bg-blue-600 transition-colors duration-200`}
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
                        <div className="flex gap-1 flex-wrap overflow-x-auto">
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);
                                if (!isNaN(keyNum)) {
                                    return (
                                        <Contact 
                                            label={label} 
                                            number={key} 
                                            key={key + label} 
                                            isHighlighted={
                                                highlightedChange && 
                                                highlightedChange.label === label && 
                                                (
                                                    highlightedChange.key === key || // highlight specific contact
                                                    highlightedChange.key === null   // or highlight all contacts if whole electrode
                                                )
                                            } 
                                        />
                                    );
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

    // Modify handleSubmitChanges function
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
        <div className="flex flex-col h-screen p-4">
            <div className="p-4">
                <div className="flex justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">Localization</h1>
                        {!readOnly && (
                            <>
                                <ViewLogsButton 
                                    fileId={fileId} 
                                    onHighlightChange={(label, key) => {
                                        setExpandedElectrode(label);
                                    }}
                                />
                                {isSharedFile ? (
                                    <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                                        Shared File
                                    </span>
                                ) : (
                                    <ShareButton fileId={fileId} />
                                )}
                            </>
                        )}
                    </div>
                    {!readOnly && (
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
                    )}
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
