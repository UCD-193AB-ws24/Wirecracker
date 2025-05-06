import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dropdown from './utils/Dropdown';
import PlanTypePage from './pages/StimulationPlanning/PlanTypeSelection'
import ContactSelection from './pages/StimulationPlanning/ContactSelection'
import FunctionalTestSelection from './pages/StimulationPlanning/FunctionalTestSelection'
import UserDocumentation from './pages/UserDocumentation'
import Debug from './pages/Debug';
import DatabaseTable from "./pages/DatabaseTable";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import { parseCSVFile, Identifiers } from './utils/CSVParser';
import Localization from './pages/Localization';
import ContactDesignation from './pages/ContactDesignation/ContactDesignation';
import { FcGoogle } from 'react-icons/fc';
import config from '../config.json' with { type: 'json' };
import { ErrorProvider, useError } from './context/ErrorContext';
import DBLookup from './pages/DatabaseLookup';

const backendURL = config.backendURL;

const Tab = ({ title, isActive, onClick, onClose, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (title !== 'Home') {
            setIsEditing(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editedTitle.trim() !== '' && editedTitle !== title) {
            onRename(editedTitle.trim());
        } else {
            setEditedTitle(title);
        }
    };

    return (
        <div 
            className={`flex items-center px-4 py-2 border-b-2 cursor-pointer ${
                isActive ? 'border-sky-700 text-sky-700' : 'border-transparent'
            }`}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    className="w-32 border rounded px-1 outline-none text-black"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span>{title}</span>
            )}
            {title !== 'Home' && (
                <button 
                    className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

const PatientTabGroup = ({ patientId, tabs, activeTab, onTabClick, onTabClose, onTabRename }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const patientTabs = tabs.filter(tab => tab.state?.patientId === patientId);
    const groupRef = useRef(null);
    
    if (patientTabs.length === 0) return null;

    const handleCloseGroup = (e) => {
        e.stopPropagation();
        // Close all tabs in the group at once by passing an array of tab IDs
        onTabClose(patientTabs.map(tab => tab.id));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (groupRef.current && !groupRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative group" ref={groupRef}>
            <div 
                className="flex items-center px-4 py-2 border-b-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="mr-5 text-gray-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </span>
                <span className="font-semibold">Patient {patientId}</span>
                
                <button 
                    className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={handleCloseGroup}
                >
                    ×
                </button>
            </div>
            {isExpanded && (
                <div className="absolute left-0 top-full z-10 bg-white shadow-lg border border-gray-200 min-w-[200px]">
                    {patientTabs.map(tab => (
                        <div 
                            key={tab.id}
                            className={`flex items-center px-4 py-2 border-b-2 cursor-pointer ${
                                activeTab === tab.id ? 'border-sky-700 text-sky-700' : 'border-transparent'
                            }`}
                            onClick={() => {
                                onTabClick(tab.id);
                                setIsExpanded(false);
                            }}
                            onDoubleClick={() => {
                                if (tab.title !== 'Home') {
                                    const newTitle = prompt('Enter new title:', tab.title);
                                    if (newTitle && newTitle.trim() !== '') {
                                        onTabRename(tab.id, newTitle.trim());
                                    }
                                }
                            }}
                        >
                            <span>{tab.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UserProfile = ({ onSignOut }) => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await fetch(`${backendURL}/api/user/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }

                const user = await response.json();
                setUserName(user.name);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tabs');
        localStorage.removeItem('activeTab');
        onSignOut();
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-gray-50">
            <span className="text-sky-700 font-semibold">{userName}</span>
            <button 
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-red-600 cursor-pointer hover:text-red-800 font-medium"
            >
                Sign Out
            </button>
        </div>
    );
};

// Shared utility functions for file operations
const FileUtils = {
    // Transform database records into the electrode format used by Localization component
    transformLocalizationData: (dbRecords) => {
        if (!dbRecords || dbRecords.length === 0) {
            console.warn('No data to transform');
            return {};
        }
        
        const electrodes = {};
        
        console.log('Starting data transformation with record count:', dbRecords.length);
        
        // Group by electrode
        dbRecords.forEach((record, index) => {
            if (!record.electrode) {
                console.warn(`Record ${index} missing electrode data:`, record);
                return;
            }
            
            const electrode = record.electrode;
            const label = electrode.label;
            const description = electrode.description || 'Unknown Electrode';
            const contact = record.contact;
            const regionName = record.region?.name || '';
            const tissueType = record.tissue_type || '';
            
            console.log(`Processing record ${index}: Electrode=${label}, Contact=${contact}, Type=${tissueType}, Region=${regionName}`);
            
            // Initialize electrode if not exists
            if (!electrodes[label]) {
                electrodes[label] = {
                    description: description,
                    type: electrode.type || 'DIXI' // Include the electrode type, default to DIXI if not specified
                };
                console.log(`Created new electrode: ${label} with type: ${electrode.type || 'DIXI'}`);
            }
            
            // Handle contacts based on tissue type
            if (!electrodes[label][contact]) {
                electrodes[label][contact] = {
                    associatedLocation: tissueType,
                    contactDescription: regionName
                };
                console.log(`Added contact ${contact} to electrode ${label}`);
            } else if (tissueType === 'GM' && electrodes[label][contact].associatedLocation === 'GM') {
                // This is a GM/GM case (two entries for the same contact)
                const existingDesc = electrodes[label][contact].contactDescription;
                electrodes[label][contact].associatedLocation = 'GM/GM';
                electrodes[label][contact].contactDescription = `${existingDesc}+${regionName}`;
                console.log(`Updated contact ${contact} in electrode ${label} to GM/GM: ${existingDesc}+${regionName}`);
            }
        });
        
        console.log('Transformation complete. Electrode count:', Object.keys(electrodes).length);
        return electrodes;
    },
    
    // Handle opening a file from the database
    handleFileOpen: async (file, openSavedFile, showError) => {
        try {
            console.log(`Attempting to load file ID: ${file.file_id} (${file.filename})`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                showError('Authentication required to open files');
                return;
            }
            
            // Use the backend API to check file type and get data
            const response = await fetch(`${backendURL}/api/files/check-type?fileId=${file.file_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to check file type: ${response.statusText}`);
            }
            
            const fileTypeData = await response.json();
            console.log('File type check result:', fileTypeData);
            
            // If localization data exists, fetch the detailed data
            if (fileTypeData.hasLocalization) {
                const localizationResponse = await fetch(`${backendURL}/api/files/localization?fileId=${file.file_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!localizationResponse.ok) {
                    throw new Error('Failed to fetch localization data');
                }
                
                const localizationData = await localizationResponse.json();
                
                // Transform the database records into the electrode format
                const electrodes = FileUtils.transformLocalizationData(localizationData);
                
                // Open in localization view with the saved data
                openSavedFile('localization', { 
                    name: file.filename || 'Unnamed Localization',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: { data: electrodes }
                });
                return;
            }
            
            // Handle designation data
            if (fileTypeData.hasDesignation) {
                console.log('Found designation data:', fileTypeData.designationData);
                openSavedFile('designation', {
                    name: file.filename || 'Unnamed Designation',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: fileTypeData.designationData.designation_data,
                    originalData: fileTypeData.designationData.localization_data
                });
                return;
            }
            
            // Handle test selection data
            if (fileTypeData.hasTestSelection) {
                console.log('Found test selection data:', fileTypeData.testSelectionData);
                openSavedFile('csv-functional-test', {
                    name: file.filename || 'Unnamed Test Selection',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: {
                        tests: fileTypeData.testSelectionData.tests,
                        contacts: fileTypeData.testSelectionData.contacts
                    }
                });
                return;
            }
            
            // Handle stimulation data
            if (fileTypeData.hasStimulation) {
                console.log('Found stimulation data:', fileTypeData.stimulationData);
                openSavedFile(fileTypeData.stimulationData.is_mapping ? 'csv-functional-mapping' : 'csv-stimulation', {
                    name: file.filename || 'Unnamed Stimulation',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: {
                        data: fileTypeData.stimulationData.stimulation_data,
                        planOrder: fileTypeData.stimulationData.plan_order
                    }
                });
                return;
            }
            
            // If no data found in any table, create new empty localization
            console.log('No data found for this file, creating new empty localization');
            openSavedFile('localization', { 
                name: file.filename || 'Unnamed Localization',
                fileId: file.file_id,
                fileName: file.filename,
                creationDate: file.creation_date,
                modifiedDate: file.modified_date,
                data: { data: {} }
            });
            
        } catch (error) {
            console.error('Error loading file:', error);
            showError(`Failed to load file data: ${error.message}`);
        }
    },
    
    // Fetch user files from the database
    fetchUserFiles: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return [];
            }
            
            const response = await fetch(`${backendURL}/api/files`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user files');
            }

            const files = await response.json();
            return files || [];
        } catch (error) {
            console.error('Error fetching user files:', error);
            return [];
        }
    }
};

const HomePage = () => {
    const token = localStorage.getItem('token') || null;
    const [tabs, setTabs] = useState(() => {
        const savedTabs = localStorage.getItem('tabs');
        return savedTabs ? JSON.parse(savedTabs) : [{ id: 'home', title: 'Home', content: 'home' }];
    });
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'home';
    });
    const [error, setError] = useState("");
    const [localizationCounter, setLocalizationCounter] = useState(1);
    
    useEffect(() => {
        localStorage.setItem('tabs', JSON.stringify(tabs));
        localStorage.setItem('activeTab', activeTab);
    }, [tabs, activeTab]);

    // Add event listener for designation tab creation
    useEffect(() => {
        const handleAddDesignationTab = (event) => {
            addTab('designation', event.detail);
        };

        window.addEventListener('addDesignationTab', handleAddDesignationTab);
        return () => {
            window.removeEventListener('addDesignationTab', handleAddDesignationTab);
        };
    }, []);

    // Add event listener for stimulation tab creation
    useEffect(() => {
        const handleAddStimulationTab = (event) => {
            addTab('stimulation', event.detail);
        };

        window.addEventListener('addStimulationTab', handleAddStimulationTab);
        return () => {
            window.removeEventListener('addStimulationTab', handleAddStimulationTab);
        };
    }, []);

    // Add event listener for functional mapping tab creation
    useEffect(() => {
        const handleAddFunctionalTestTab = (event) => {
            addTab('functional-test', event.detail);
        };

        window.addEventListener('addFunctionalTestTab', handleAddFunctionalTestTab);
        return () => {
            window.removeEventListener('addFunctionalTestTab', handleAddFunctionalTestTab);
        };
    }, []);

    // Add event listener for documentation tab creation
    useEffect(() => {
        const handleAddFunctionalTestTab = (event) => {
            addTab('usage-docs', event.detail);
        };

        window.addEventListener('addDocumentationTab', handleAddFunctionalTestTab);
        return () => {
            window.removeEventListener('addDocumentationTab', handleAddFunctionalTestTab);
        };
    }, []);

    // Add event listener for db lookup tab creation
    useEffect(() => {
        const handleAddFunctionalTestTab = (event) => {
            addTab('database-lookup', event.detail);
        };

        window.addEventListener('addDatabaseLookupTab', handleAddFunctionalTestTab);
        return () => {
            window.removeEventListener('addDatabaseLookupTab', handleAddFunctionalTestTab);
        };
    }, []);

    useEffect(() => {
        // Find the highest localization number to initialize the counter
        if (tabs.length > 1) {
            const pattern = /Localization(\d+)/;
            const numbers = tabs
                .map(tab => {
                    const match = tab.title.match(pattern);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(num => !isNaN(num));
            
            if (numbers.length > 0) {
                const max = Math.max(...numbers);
                setLocalizationCounter(max + 1);
            }
        }
    }, []);

    const addTab = (type, data = null) => {
        const generateUniqueId = () => {
            return Math.floor(Date.now() % 1000000000); // Last 9 digits as integer for fileId
        };

        const generatePatientId = () => {
            // Generate a UUID v4
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        let title = '';
        let patientId = null;
        let fileId = generateUniqueId();

        console.log('Adding new tab:', {
            type,
            data,
            patientIdFromData: data?.patientId,
            patientIdFromState: data?.state?.patientId,
            patientIdFromOriginalData: data?.originalData?.patientId
        });

        switch (type) {
            case 'localization':
                title = 'Localization';
                patientId = generatePatientId(); // Generate UUID for patient_id
                break;
            case 'csv-localization':
                title = 'CSV Localization';
                patientId = generatePatientId(); // Generate UUID for patient_id
                break;
            case 'designation':         
                title = 'Designation';
                patientId = data.patientId || data.state?.patientId || data.originalData?.patientId;
                console.log('Setting patientId for designation:', {
                    finalPatientId: patientId,
                    sources: {
                        dataPatientId: data.patientId,
                        statePatientId: data.state?.patientId,
                        originalDataPatientId: data.originalData?.patientId
                    }
                });
                break;
            case 'csv-designation':
                title = data.name;
                patientId = generatePatientId();
                break;
            case 'csv-stimulation':     
                title = data.name;
                patientId = data.patientId ? data.patientId : generatePatientId(); // Use existing patient_id from parent localization
                break;
            case 'csv-functional-mapping': 
                title = data.name;
                patientId = data.patientId ? data.patientId : generatePatientId(); // Use existing patient_id from parent localization
                break;
            case 'csv-functional-test':       
                title = data.name;
                patientId = data.patientId ? data.patientId : generatePatientId(); // Use existing patient_id from parent localization
                break;
            case 'stimulation':         
                title = 'Stimulation Plan';
                patientId = data.patientId || data.state?.patientId || data.originalData?.patientId;
                console.log('Setting patientId for stimulation:', {
                    finalPatientId: patientId,
                    sources: {
                        dataPatientId: data.patientId,
                        statePatientId: data.state?.patientId,
                        originalDataPatientId: data.originalData?.patientId
                    }
                });
                break;
            case 'usage-docs':
                title = `docs - ${data.path}`;
                // TODO do something about patient ID that is safe
                break;
            case 'seizure-recreation':
            case 'cceps':
                return <ContactSelection
                    key={currentTab.id}
                    isFunctionalMapping={false}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'functional-mapping':
                return <ContactSelection
                    key={currentTab.id}
                    switchContent={(newContent) => updateTabContent(currentTab.id, newContent)}
                    isFunctionalMapping={true}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'functional-test':
                title = 'Test Selection';
                patientId = data.patientId ? data.patientId : generatePatientId(); // Use existing patient_id from parent localization
                break;
            case 'database-lookup':     title = 'Lookup'; break;
            default:
                return null;
        }

        const newTab = {
            id: Date.now().toString(),
            title: title,
            content: type,
            data: data,
            state: {
                fileId: fileId,
                patientId: patientId, // Include patient_id in the state
                fileName: title,
                creationDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            }
        };
        
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTab(newTab.id);
    };

    const updateTabState = (tabId, newState) => {
        setTabs(prevTabs => 
            prevTabs.map(tab => 
                tab.id === tabId 
                    ? { ...tab, state: {...tab.state, ...newState} }
                    : tab
            )
        );
    };

    const updateTabContent = (tabId, newContent) => {
        setTabs(prevTabs => 
            prevTabs.map(tab => 
                tab.id === tabId 
                    ? { ...tab, content: newContent }
                    : tab
            )
        );
    };

    const renameTab = (tabId, newTitle) => {
        setTabs(prevTabs => 
            prevTabs.map(tab => {
                if (tab.id === tabId) {
                    const updatedTab = { 
                        ...tab, 
                        title: newTitle,
                        state: {
                            ...tab.state,
                            fileName: newTitle
                        }
                    };
                    return updatedTab;
                }
                return tab;
            })
        );
    };

    const closeTab = (tabId) => {
        // If tabId is an array, close all tabs in the array
        const tabsToClose = Array.isArray(tabId) ? tabId : [tabId];
        
        const newTabs = tabs.filter(tab => !tabsToClose.includes(tab.id));
        setTabs(newTabs);
        
        // If the active tab was closed, set the active tab to the last remaining tab
        if (tabsToClose.includes(activeTab)) {
            setActiveTab(newTabs[newTabs.length - 1]?.id || 'home');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError("");

        try {
            const { identifier, data } = await parseCSVFile(file, false, (msg) => setError(msg));
            if (identifier === Identifiers.LOCALIZATION) {
                addTab('csv-localization', { name: file.name, data });
            } else if (identifier === Identifiers.DESIGNATION) {
                addTab('csv-designation', { name: file.name, data });
            } else if (identifier === Identifiers.STIMULATION) {
                addTab('csv-stimulation', { name: file.name, data });
            }else if (identifier === Identifiers.STIMULATION_FUNCTION) {
                addTab('csv-functional-mapping', { name: file.name, data });
            }else if (identifier === Identifiers.TEST_PLANNING) {
                addTab('csv-functional-test', { name: file.name, data });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSignOut = () => {
        setTabs([{ id: 'home', title: 'Home', content: 'home' }]);
        setActiveTab('home');
    };

    const openSavedFile = (type, fileData) => {
        if (type === 'localization') {
            console.log('Opening saved file:', fileData);
            
            // Create a new tab with the loaded file data
            const newTab = {
                id: Date.now().toString(),
                title: fileData.name,
                content: 'csv-localization',  // Use csv-localization to reuse existing code path
                data: fileData.data,
                state: {
                    fileId: parseInt(fileData.fileId),  // Ensure fileId is an integer
                    patientId: fileData.patientId,
                    fileName: fileData.name,
                    creationDate: fileData.creationDate || new Date().toISOString(),
                    modifiedDate: fileData.modifiedDate || new Date().toISOString(),
                    electrodes: fileData.data.data  // Preserve loaded electrode data including type
                }
            };
            
            console.log('Created new tab with state:', newTab.state);
            
            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
        } 
        else if (type === 'designation') {
            console.log('Opening saved file:', fileData);
            
            const newTab = {
                id: Date.now().toString(),
                title: fileData.name,
                content: 'designation',
                data: { data: fileData.data, originalData: fileData.originalData },
                state: {
                    fileId: parseInt(fileData.fileId),  // Ensure fileId is an integer
                    patientId: fileData.patientId,
                    fileName: fileData.name,
                    creationDate: fileData.creationDate || new Date().toISOString(),
                    modifiedDate: fileData.modifiedDate || new Date().toISOString(),
                    electrodes: fileData.data,
                    localizationData: fileData.originalData  // This should include the electrode type
                }
            };

            console.log('Created new tab with state:', newTab.state);

            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
        }
        else if (type === 'csv-functional-test') {
            console.log('Opening saved test selection file:', fileData);

            const newTab = {
                id: Date.now().toString(),
                title: fileData.name,
                content: type,
                data: fileData.data,
                state: {
                    fileId: parseInt(fileData.fileId),  // Ensure fileId is an integer
                    patientId: fileData.patientId,
                    fileName: fileData.name,
                    creationDate: fileData.creationDate || new Date().toISOString(),
                    modifiedDate: fileData.modifiedDate || new Date().toISOString(),
                    tests: fileData.data.tests,
                    contacts: fileData.data.contacts
                }
            };

            console.log('Created new test selection tab with state:', newTab.state);

            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
        }
        else if (type === 'csv-stimulation' || type === 'csv-functional-mapping') {
            console.log('Opening saved stimulation file:', fileData);

            const newTab = {
                id: Date.now().toString(),
                title: fileData.name,
                content: type,
                data: fileData.data,
                state: {
                    fileId: parseInt(fileData.fileId),  // Ensure fileId is an integer
                    patientId: fileData.patientId,
                    fileName: fileData.name,
                    creationDate: fileData.creationDate || new Date().toISOString(),
                    modifiedDate: fileData.modifiedDate || new Date().toISOString(),
                    electrodes: fileData.data.data,
                    planOrder: fileData.data.planOrder,
                    isFunctionalMapping: type === 'csv-functional-mapping'
                }
            };

            console.log('Created new stimulation tab with state:', newTab.state);

            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
        } else {
            // Fallback to basic tab creation
            addTab(type, { name: fileData.name });
        }
    };

    // Make handleFileClick available globally for the database modal
    window.handleFileClick = (file) => {
        FileUtils.handleFileOpen(file, openSavedFile, (message) => {
            console.error('Error loading file:', message);
        });
    };

    const renderTabContent = () => {
        const currentTab = tabs.find(tab => tab.id === activeTab);
        switch (currentTab.content) {
            case 'home':
                return (
                    <div className="bg-sky-50 h-full px-2 flex flex-col-reverse items-center
                                    md:px-5
                                    lg:px-10 lg:flex-row lg:items-baseline
                                    xl:px-15">
                        {token ? (
                            <>
                                <div className="lg:basis-6 lg:flex-auto mt-15 flex flex-col">
                                    <Activity />
                                    <RecentFiles
                                        onOpenFile={openSavedFile}
                                        className="mt-2 lg:mt-5"
                                    />
                                </div>
                                <Center 
                                    token={token} 
                                    onNewLocalization={() => addTab('localization')}
                                    onFileUpload={handleFileUpload}
                                    error={error}
                                />
                                <div className="lg:basis-6 lg:flex-auto"></div>
                            </>
                        ) : (
                            <Center 
                                onNewLocalization={() => addTab('localization')}
                                onFileUpload={handleFileUpload}
                                error={error}
                            />
                        )}
                    </div>
                );
            case 'localization':
                return <Localization 
                    key={currentTab.id}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'csv-localization':
                return <Localization
                    key={currentTab.id}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'designation':
                return <ContactDesignation
                    key={currentTab.id}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'csv-designation':
                return <ContactDesignation
                    key={currentTab.id}
                    initialData={currentTab.data.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'stimulation':
                return <PlanTypePage
                    key={currentTab.id}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    switchContent={(newContent) => updateTabContent(currentTab.id, newContent)}
                />;
            case 'seizure-recreation':
            case 'cceps':
                return <ContactSelection
                    key={currentTab.id}
                    isFunctionalMapping={false}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'csv-stimulation':
                return <ContactSelection
                    key={currentTab.id}
                    isFunctionalMapping={false}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'functional-mapping':
                return <ContactSelection
                    key={currentTab.id}
                    switchContent={(newContent) => updateTabContent(currentTab.id, newContent)}
                    isFunctionalMapping={true}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'csv-functional-mapping':
                return <ContactSelection
                    key={currentTab.id}
                    switchContent={(newContent) => updateTabContent(currentTab.id, newContent)}
                    isFunctionalMapping={true}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'functional-test':
            case 'csv-functional-test':
                return <FunctionalTestSelection
                    key={currentTab.id}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            case 'usage-docs':
                return <UserDocumentation
                    key={currentTab.id}
                    initialData={currentTab.data}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />
            case 'database-lookup':
                return <DBLookup
                    key={currentTab.id}
                    initialData={{}}
                    onStateChange={(newState) => updateTabState(currentTab.id, newState)}
                    savedState={currentTab.state}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="h-dvh flex flex-col">
            <div className="flex flex-col border-b">
                <div className="flex">
                    {tabs.filter(tab => !tab.state?.patientId).map(tab => (
                        <Tab
                            key={tab.id}
                            title={tab.title}
                            isActive={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            onClose={() => closeTab(tab.id)}
                            onRename={(newTitle) => renameTab(tab.id, newTitle)}
                        />
                    ))}
                    
                    {/* Group tabs by patient ID */}
                    {Array.from(new Set(tabs
                        .filter(tab => tab.state?.patientId)
                        .map(tab => tab.state.patientId)))
                        .map(patientId => (
                            <PatientTabGroup
                                key={patientId}
                                patientId={patientId}
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabClick={setActiveTab}
                                onTabClose={closeTab}
                                onTabRename={renameTab}
                            />
                        ))
                    }
                    
                    <button 
                        className="px-4 py-2 text-gray-600 cursor-pointer hover:text-gray-800"
                        onClick={() => addTab('localization')}
                    >
                        +
                    </button>
                </div>
            </div>
            {token && <UserProfile onSignOut={handleSignOut} />}

            <div className="grow">
                {renderTabContent()}
            </div>
        </div>
    );
};

const Center = ({ token, onNewLocalization, onFileUpload, error }) => {
    const [showDatabaseModal, setShowDatabaseModal] = useState(false);
    const [databaseFiles, setDatabaseFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showError } = useError();

    const loadDatabaseFiles = async () => {
        setIsLoading(true);
        const files = await FileUtils.fetchUserFiles();
        setDatabaseFiles(files);
        setIsLoading(false);
    };
    
    return (
        <div className="px-2 self-center flex flex-col justify-center items-center m-auto
                        md:px-7
                        lg:px-12 lg:basis-7 lg:flex-auto
                        xl:px-15">
            <Logo />
            {token ? (
                <>
                    <button className="bg-white text-blue-500 border-solid border-1 border-blue-300 rounded-full w-64 py-3"
                            onClick={() => window.dispatchEvent(new CustomEvent('addDatabaseLookupTab'))}>
                        Search the Database
                    </button>
                    <button
                        className="border-solid border-1 border-sky-700 bg-sky-700 text-white font-semibold rounded-xl w-34 mt-3 py-1 text-xs align-middle transition-colors duration-200 cursor-pointer hover:bg-sky-100 hover:text-sky-700
                                   md:w-40 md:text-sm
                                   lg:w-48 lg:mt-4 lg:py-2 lg:text-md
                                   xl:w-64 xl:mt-5 xl:py-3 xl:text-lg"
                        onClick={onNewLocalization}>
                        Create New Localization
                    </button>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={onFileUpload}
                        style={{ display: 'none' }}
                        id="fileInput"
                    />
                    <Dropdown 
                        closedText="Open File"
                        openText="Open File ▾"
                        closedClassName="border-solid border-1 border-sky-700 bg-sky-700 text-white font-semibold rounded-xl w-34 mt-3 py-1 text-xs transition-colors duration-200 cursor-pointer hover:bg-sky-100 hover:text-sky-700
                                         md:w-40 md:text-sm
                                         lg:w-48 lg:mt-4 lg:py-2 lg:text-md
                                         xl:w-64 xl:mt-5 xl:py-3 xl:text-lg"
                        openClassName="border-solid border-1 border-sky-700 bg-sky-100 text-sky-700 font-semibold rounded-xl w-64 mt-3 py-1 text-xs cursor-pointer
                                       md:w-40 md:text-sm
                                       lg:w-48 lg:mt-4 lg:py-2 lg:text-md
                                       xl:w-64 xl:mt-5 xl:py-3 xl:text-lg"
                        options="Open-Local Open-Database"
                        optionClassName="block w-34 py-1 text-xs text-gray-700 hover:bg-gray-100
                                         md:w-40
                                         lg:w-48 lg:py-2 lg:text-sm
                                         xl:w-64"
                        menuClassName="w-34 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none
                                       md:w-40
                                       lg:w-48
                                       xl:w-64"
                        onOptionClick={(option) => {
                            switch(option) {
                                case "Open-Local":
                                    document.getElementById('fileInput').click();
                                    break;
                                case "Open-Database":
                                    loadDatabaseFiles();
                                    setShowDatabaseModal(true);
                                    break;
                            }
                        }}
                    />
                    {error && <p className="text-red-500 mt-2">{error}</p>}

                    {/* Database Files Modal */}
                    {showDatabaseModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl w-4/5 max-w-3xl max-h-[80vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold">Open File from Database</h2>
                                    <button 
                                        onClick={() => setShowDatabaseModal(false)}
                                        className="text-gray-500 transition-colors duration-200 cursor-pointer hover:text-gray-700 text-xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600">Loading your files...</p>
                                    </div>
                                ) : databaseFiles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600">No files found. Create a new file to get started.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {databaseFiles.map(file => (
                                            <div 
                                                key={file.file_id}
                                                className="py-3 px-4 transition-colors duration-200 hover:bg-sky-50 cursor-pointer flex justify-between items-center"
                                                onClick={() => {
                                                    window.handleFileClick(file);
                                                    setShowDatabaseModal(false);
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{file.filename || 'Unnamed File'}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Created: {new Date(file.creation_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Modified: {new Date(file.modified_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowDatabaseModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded  transition-colors duration-200 cursor-pointer hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : <SignInButtons />}
        </div>
    );
};

const Activity = () => {
    return (
        <div>
            <h2 className="text-xl font-bold my-1 whitespace-nowrap
                           md:text-2xl
                           lg:text-3xl lg:my-2
                           xl:text-4xl xl:my-3">
                My Files
            </h2>
            <div className="mx-2">
                <ToReview />
                <Approved />
            </div>
        </div>
    );
};

const RecentFiles = ({ onOpenFile, className }) => {
    const [recentLocalizations, setRecentLocalizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useError();
    
    useEffect(() => {
        const fetchRecentFiles = async () => {
            setIsLoading(true);
            const files = await FileUtils.fetchUserFiles();
            setRecentLocalizations(files.slice(0, 7)); // Limit to 7 most recent
            setIsLoading(false);
        };
        
        fetchRecentFiles();
    }, []);
    
    const handleFileClick = (file) => {
        // Show loading state in the UI
        const fileElement = document.getElementById(`file-${file.file_id}`);
        if (fileElement) {
            fileElement.classList.add('text-sky-600');
            fileElement.querySelector('.filename').innerText = "Loading...";
        }
        
        FileUtils.handleFileOpen(file, onOpenFile, showError)
            .finally(() => {
                // Reset the loading state if needed
                if (fileElement && fileElement.querySelector('.filename')) {
                    fileElement.querySelector('.filename').innerText = file.filename || 'Unnamed Localization';
                }
            });
    };
    
    return (
        <div className={`justify-center ${className}`}>
            <h3 className="text-xl font-bold
                           md:text-2xl
                           lg:text-3xl
                           xl:text-4xl">
                Recent Files
            </h3>
            <div className="bg-sky-200 rounded-xl p-2 mt-2">
                {isLoading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : recentLocalizations.length > 0 ? (
                    <div>
                        {recentLocalizations.map((file) => (
                            <div 
                                id={`file-${file.file_id}`}
                                key={file.file_id} 
                                className="hover:bg-sky-50 hover:text-sky-600 rounded cursor-pointer py-1 pr-1 transition-colors duration-150 flex justify-between items-center"
                                onClick={() => handleFileClick(file)}
                            >
                                <div className="text-xs truncate max-w-30 filename px-1
                                                md:max-w-42
                                                lg:max-w-50 lg:text-sm lg:px-2
                                                xl:max-w-64">
                                    {file.filename || 'Unnamed Localization'}
                                </div>
                                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                    {new Date(file.modified_date).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500">No files available</div>
                )}
            </div>
        </div>
    );
};

const Logo = () => {
    return (
        <div className="flex flex-col items-center m-5 mt-20 lg:mb-10">
            <h1 className="text-3xl font-bold
                           lg:text-5xl
                           xl:text-8xl">
                Wirecracker
            </h1>
        </div>
    );
};

export const GoogleSignInButton = () => {
    const handleGoogleSignIn = () => {
        window.location.href = `${backendURL}/auth/google`;
    };

    return (
        <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <FcGoogle className="h-5 w-5 mr-2" />
            Sign in with Google
        </button>
    );
};

const SignInButtons = () => {
    return (
        <div>
            <div className="flex justify-center m-5
                            md:m-6
                            lg:m-8
                            xl:m-10">
                <Link to="/signup">
                    <button
                        className="border-solid border-1 border-sky-700 bg-sky-700 text-white font-semibold rounded-xl w-24 py-1 mr-2 text-xs transition-colors duration-200 cursor-pointer hover:bg-sky-100 hover:text-sky-700
                                   md:w-28 md:mr-3 md:text-sm
                                   lg:w-32 lg:py-2 lg:mr-4 lg:text-md
                                   xl:w-40 xl:py-3 xl:mr-5 xl:text-xl"
                    >
                        Sign Up
                    </button>
                </Link>
                <Link to="/login">
                    <button
                        className="border-solid border-1 border-sky-700 bg-sky-700 text-white font-semibold rounded-xl w-24 py-1 text-xs transition-colors duration-200 cursor-pointer hover:bg-sky-100 hover:text-sky-700
                                   md:w-28 md:text-sm
                                   lg:w-32 lg:py-2 lg:text-md
                                   xl:w-40 xl:py-3 xl:text-xl"
                    >
                        Log In
                    </button>
                </Link>
            </div>
        </div>
    );
};

const ToReview = () => {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    return (
        <div
            className="text-violet-500 text-base font-semibold flex gap-x-2 cursor-pointer
                       md:text-lg
                       lg:text-xl
                       xl:text-2xl"
            onClick={() => setIsReviewOpen(!isReviewOpen)}
        >
            {isReviewOpen ? (
                <>
                    <div className="before:content-['▾']"></div>
                    <div className="mb-5 whitespace-nowrap">
                        <div>To Review</div>
                    </div>
                </>
            ) : (
                <>
                    <div className="before:content-['▸']"></div>
                    <div>To Review</div>
                </>
            )}
            
        </div>
    );
};

const Approved = () => {
    const [isApprovedOpen, setIsApprovedOpen] = useState(false);

    return (
        <div
            className="text-green-500 text-base font-semibold flex gap-x-2 cursor-pointer
                       md:text-lg
                       lg:text-xl
                       xl:text-2xl"
            onClick={() => setIsApprovedOpen(!isApprovedOpen)}
        >
            {isApprovedOpen ? (
                <>
                    <div className="before:content-['▾']"></div>
                    <div className="mb-5">
                        <div>Approved</div>
                    </div>
                </>
            ) : (
                <>
                    <div className="before:content-['▸']"></div>
                    <div>Approved</div>
                </>
            )}
        </div>
    );
};

const App = () => {
    return (
        <ErrorProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
{/*                    <Route path="/localization" element={<Localization />} />
                    <Route path="/stimulation" element={<PlanTypePage />} />
                    <Route path="/stimulation/contacts" element={<ContactSelection />} />
                    <Route path="/stimulation/functional-tests" element={<FunctionalTestSelection />} />*/}
                    <Route path="/debug" element={<Debug />} />
                    <Route path="/database/:table" element={<DatabaseTable />} />
                    <Route path="/auth-success" element={<GoogleAuthSuccess />} />
                    <Route path="/usage-docs/:path" element={<UserDocumentation/>} />
                </Routes>
            </Router>
        </ErrorProvider>
    );
};

export default App;
