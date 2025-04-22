import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { supabase } from '../../utils/supabaseClient';
import Localization from '../../pages/Localization';

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

export default ViewLogsButton; 