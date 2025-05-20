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
                        type: type,
                        fileName: title
                    },
                    title: title
                }
            });
            window.dispatchEvent(event);

            // Find any existing designation tab for this patient
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab =>
                tab.content === 'stimulation' && 
                tab.state?.patientId === initialData.state?.patientId
            );
            if (existingTab) {
                // Close the plan type selection tab
                const closeEvent = new CustomEvent('closeTab', {
                    detail: { tabId: existingTab.id }
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
    );
};

export default PlanTypePage;
