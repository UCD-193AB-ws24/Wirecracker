import { useState } from 'react';
import LocalizationContact from './localizationContact';
import EditElectrodeModal from './EditElectrodeModal';

const Electrode = ({ 
    name,
    electrodes,
    expandedElectrode,
    setExpandedElectrode,
    readOnly,
    highlightedChange,
    isSharedFile,
    fileId,
    onHighlightChange,
    handleContactUpdate,
    addElectrode,
    setSubmitFlag,
    submitFlag,
    setModifiedDate,
    checkForChanges,
    setElectrodes
}) => {
    const [label, setLabel] = useState(name);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isHighlighted = highlightedChange && 
        highlightedChange.label === label && 
        highlightedChange.key === null;

    const handleDelete = () => {
        setElectrodes(prevElectrodes => {
            const tempElectrodes = { ...prevElectrodes };
            delete tempElectrodes[label];
            
            // If this is a shared file, check for changes immediately
            if (isSharedFile) {
                checkForChanges(tempElectrodes);
            }
            
            return tempElectrodes;
        });
        
        // If the deleted electrode was expanded, collapse it
        if (label === expandedElectrode) {
            setExpandedElectrode('');
        }
        
        setModifiedDate(new Date().toISOString());
        setShowDeleteModal(false);
    };

    return (
        <div className={`w-full bg-white rounded-lg shadow-md mb-5 overflow-hidden ${
            isHighlighted ? 'ring-2 ring-blue-500' : ''
        }`}>
            <div className={`flex justify-between items-center ${
                isHighlighted 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-blue-500 text-white'
            }`}>
                <button
                    className="flex justify-between items-center p-4 grow font-semibold hover:bg-blue-600 transition-colors duration-200"
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
                {!readOnly && (
                    <div className="flex gap-2 p-2">
                        <button
                            className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors duration-200 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEditModal(true);
                            }}
                            title="Edit electrode"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteModal(true);
                            }}
                            title="Delete electrode"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            {label === expandedElectrode &&
                <div className="p-4 bg-gray-50">
                    <div className="flex gap-1 flex-wrap overflow-x-auto">
                        {Object.keys(electrodes[label]).map((key) => {
                            const keyNum = parseInt(key);
                            if (!isNaN(keyNum)) {
                                return (
                                    <LocalizationContact 
                                        key={key + label}
                                        label={label}
                                        number={key}
                                        isHighlighted={
                                            highlightedChange && 
                                            highlightedChange.label === label && 
                                            (
                                                highlightedChange.key === key || // highlight specific contact
                                                highlightedChange.key === null   // or highlight all contacts if whole electrode
                                            )
                                        }
                                        readOnly={readOnly}
                                        contactData={electrodes[label][key]}
                                        onContactUpdate={handleContactUpdate}
                                        isSharedFile={isSharedFile}
                                        fileId={fileId}
                                        onHighlightChange={onHighlightChange}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            }

            <EditElectrodeModal
                trigger={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={(formData) => {
                    addElectrode(formData);
                    setSubmitFlag(!submitFlag);
                }}
                initialData={{
                    label: label,
                    description: electrodes[label].description,
                    numContacts: Object.keys(electrodes[label]).filter(key => !isNaN(parseInt(key))).length,
                    type: electrodes[label].type || 'DIXI'
                }}
                isEditMode={true}
                setElectrodes={setElectrodes}
            />

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
                        <h2 className="text-xl font-bold mb-4">Delete Electrode</h2>
                        <p className="mb-6 text-gray-600">
                            Are you sure you want to delete this electrode? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Electrode; 