import { useEffect } from "react";
import { useError } from '../../context/ErrorContext';
import config from "../../../config.json" with { type: 'json' };

const backendURL = config.backendURL;

const PlanTypePage = ({ initialData = {}, onStateChange, switchContent }) => {
    const { showError } = useError();

    // Parse CSV and put into a format that contact selection can use.
    useEffect(() => {
        onStateChange({electrodes: initialData.data});
    }, [initialData]);

    const handlePlanTypeSelect = async (type) => {
        try {
            // Check for existing tabs based on the selected type
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const isFunctionalMapping = type === 'functional-mapping';
            
            // Find existing tab based on type
            const existingTab = tabs.find(tab => {
                if (isFunctionalMapping) {
                    return (tab.content === 'csv-functional-mapping' || tab.content === 'functional-mapping') && 
                           tab.state?.patientId === initialData.state?.patientId;
                } else {
                    return (tab.content === 'csv-stimulation' || tab.content === 'stimulation' || 
                           tab.content === 'seizure-recreation' || tab.content === 'cceps') && 
                           tab.state?.patientId === initialData.state?.patientId;
                }
            });

            if (existingTab) {
                // Compare the current data with the existing tab's data
                const currentData = initialData.data;
                const existingData = existingTab.state.electrodes;
                
                // Check if the data has changed
                const hasDataChanged = JSON.stringify(currentData) !== JSON.stringify(existingData);
                
                if (hasDataChanged) {
                    // First switch to the selected content type
                    switchContent(type);
                    
                    // Then close the existing tab after a small delay to ensure state updates
                    setTimeout(() => {
                        const closeEvent = new CustomEvent('closeTab', {
                            detail: { tabId: existingTab.id }
                        });
                        window.dispatchEvent(closeEvent);
                    }, 100);
                } else {
                    // Just set the existing tab as active
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                }
            } else {
                // Check if data exists in the database for this patient
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to continue.');
                    return;
                }

                const response = await fetch(`${backendURL}/api/by-patient-stimulation/${initialData.state?.patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to check for existing data');
                }

                const result = await response.json();
                
                // Switch to the selected content type with the appropriate data
                switchContent(type, result.exists ? result.data : initialData.data);
            }
        } catch (error) {
            console.error('Error handling plan type selection:', error);
            showError('Failed to open plan type. Please try again.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="grid gap-6">
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => handlePlanTypeSelect('seizure-recreation')}>
                    Seizure Recreation
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => handlePlanTypeSelect('cceps')}>
                    CCEPs
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => handlePlanTypeSelect('functional-mapping')}>
                    Functional Mapping
                </button>
            </div>
        </div>
    );
};

export default PlanTypePage;
