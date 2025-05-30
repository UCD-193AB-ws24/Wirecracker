import { useEffect } from "react";
import { useError } from '../../context/ErrorContext';

const backendURL = __APP_CONFIG__.backendURL;

const PlanTypePage = ({ initialData = {}, onStateChange, switchContent }) => {
    const { showError } = useError();

    // Parse CSV and put into a format that contact selection can use.
    useEffect(() => {
        onStateChange({electrodes: initialData.data});
    }, [initialData]);

    const handlePlanTypeSelect = async (type) => {
        try {
            // Create new tab with appropriate content type and title
            let contentType;
            let title;
            switch(type) {
                case 'mapping':
                    contentType = 'functional-mapping';
                    title = 'Functional Mapping';
                    break;
                case 'recreation':
                    contentType = 'seizure-recreation';
                    title = 'Seizure Recreation';
                    break;
                case 'ccep':
                    contentType = 'cceps';
                    title = 'CCEPs';
                    break;
                default:
                    throw new Error('Invalid stimulation type');
            }

            // Get current tabs
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            
            // Check for existing tab of the same type
            const existingTab = tabs.find(tab =>
                tab.content === contentType && 
                tab.state?.patientId === initialData.state?.patientId
            );

            if (existingTab) {
                // Compare modified dates based on source
                const existingModifiedDate = existingTab.state.modifiedDate;
                let sourceModifiedDate;
                
                if (initialData.state?.fromDesignation) {
                    sourceModifiedDate = initialData.state.designationModifiedDate;
                } else if (initialData.state?.fromTestSelection) {
                    sourceModifiedDate = initialData.state.testSelectionModifiedDate;
                }

                if (existingModifiedDate > sourceModifiedDate) {
                    // Switch to existing tab and close plan type selection
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);

                    // Close the plan type selection tab
                    const existingPTSTab = tabs.find(tab =>
                        tab.content === 'stimulation' && 
                        tab.state?.patientId === initialData.state?.patientId
                    );
                    if (existingPTSTab) {
                        // Close the plan type selection tab
                        const closeEvent = new CustomEvent('closeTab', {
                            detail: { tabId: existingPTSTab.id }
                        });
                        window.dispatchEvent(closeEvent);
                    }
                    return;
                } else {
                    // Close existing tab as it's older
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);
                }
            } else {
                // Check database for existing file
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('User not authenticated');
                    }

                    const response = await fetch(`${backendURL}/api/by-patient-stimulation/${initialData.state?.patientId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        }
                    });

                    const result = await response.json();
                    
                    if (result.success && result.exists && result.data.type === type) {
                        const dbModifiedDate = result.data.modified_date;
                        let sourceModifiedDate;
                        
                        if (initialData.state?.fromDesignation) {
                            sourceModifiedDate = initialData.state.designationModifiedDate;
                        } else if (initialData.state?.fromTestSelection) {
                            sourceModifiedDate = initialData.state.testSelectionModifiedDate;
                        }

                        if (dbModifiedDate > sourceModifiedDate) {
                            // Create tab from database file
                            const event = new CustomEvent('addStimulationTab', {
                                detail: {
                                    data: result.data.stimulation_data,
                                    state: {
                                        ...result.data,
                                        type: type,
                                        fileName: title,
                                        fileId: result.fileId,
                                        patientId: initialData.state?.patientId
                                    },
                                    title: title
                                }
                            });
                            window.dispatchEvent(event);

                            // Close plan type selection tab
                            const closeEvent = new CustomEvent('closeTab', {
                                detail: { tabId: tabs.find(t => t.content === 'plan-type-selection')?.id }
                            });
                            window.dispatchEvent(closeEvent);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking database for existing file:', error);
                    // Continue with creating new tab if database check fails
                }
            }

            // Create a new tab with the current state and data
            const event = new CustomEvent('addStimulationTab', {
                detail: {
                    data: {
                        type: type,
                        patientId: initialData.state?.patientId,
                        data: initialData.data
                    },
                    state: {
                        ...initialData.state,
                        fileId: existingTab?.state?.fileId || null,
                        type: type,
                        fileName: title
                    },
                    title: title
                }
            });
            window.dispatchEvent(event);

            // Close the plan type selection tab
            const existingPTSTab = tabs.find(tab =>
                tab.content === 'stimulation' && 
                tab.state?.patientId === initialData.state?.patientId
            );
            if (existingPTSTab) {
                // Close the plan type selection tab
                const closeEvent = new CustomEvent('closeTab', {
                    detail: { tabId: existingPTSTab.id }
                });
                window.dispatchEvent(closeEvent);
            }
        } catch (error) {
            console.error('Error in handlePlanTypeSelect:', error);
            showError('Failed to create stimulation plan: ' + error.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-full bg-gray-100">
            <div className="grid gap-3 lg:gap-6">
                <button
                    className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                               md:h-11 md:w-80 md:text-lg
                               lg:h-13 lg:w-96 lg:text-xl
                               xl:h-16 xl:w-128 xl:text-2xl"
                    onClick={() => handlePlanTypeSelect('recreation')}>
                    Seizure Recreation
                </button>
                <button
                    className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                               md:h-11 md:w-80 md:text-lg
                               lg:h-13 lg:w-96 lg:text-xl
                               xl:h-16 xl:w-128 xl:text-2xl"
                    onClick={() => handlePlanTypeSelect('ccep')}>
                    CCEPs
                </button>
                <div className="relative">
                    <button
                        className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                                   md:h-11 md:w-80 md:text-lg
                                   lg:h-13 lg:w-96 lg:text-xl
                                   xl:h-16 xl:w-128 xl:text-2xl"
                        onClick={() => handlePlanTypeSelect('mapping')}>
                        Functional Mapping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanTypePage;
