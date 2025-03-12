import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dropdown from './utils/Dropdown';
import Debug from './pages/Debug';
import DatabaseTable from "./pages/DatabaseTable";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import { parseCSVFile, Identifiers } from './utils/CSVParser';
import Localization from './pages/Localization';
import ContactDesignation from './pages/ContactDesignation/ContactDesignation';
import { supabase } from './utils/supabaseClient';
import { FcGoogle } from 'react-icons/fc';

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
                    className="ml-2 text-gray-500 hover:text-gray-700"
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

const UserProfile = ({ onSignOut }) => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const { data: session } = await supabase
                    .from('sessions')
                    .select('user_id')
                    .eq('token', token)
                    .single();

                if (session) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('name')
                        .eq('id', session.user_id)
                        .single();
                    
                    if (user) {
                        setUserName(user.name);
                    }
                }
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
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
                Sign Out
            </button>
        </div>
    );
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
            // Generate an integer ID based on current timestamp
            return Math.floor(Date.now() % 1000000000); // Last 9 digits as integer
        };

        let title = 'New Tab';
        switch (type) {
            case 'localization':        title = `Localization${localizationCounter}`; setLocalizationCounter(prevCounter => prevCounter + 1); break;
            case 'csv-localization':    title = data.name; break;
            case 'stimulation':         title = 'New Stimulation'; break;
            case 'designation':         title = 'New Designation'; break;
            case 'csv-designation':     title = data.name; break;
            case 'csv-test_plan':       title = data.name; break;
        }

        const newTab = {
            id: Date.now().toString(),
            title: title,
            content: type,
            data: data,
            state: {
                fileId: generateUniqueId(),
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
        const newTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(newTabs);
        if (activeTab === tabId) {
            setActiveTab(newTabs[newTabs.length - 1].id);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError("");

        try {
            const { identifier, data } = await parseCSVFile(file);
            if (identifier === Identifiers.LOCALIZATION) {
                addTab('csv-localization', { name: file.name, data });
            } else if (identifier === Identifiers.DESIGNATION) {
                addTab('csv-designation', { name: file.name, data });
            } else if (identifier === Identifiers.TEST_PLAN) {
                addTab('csv-test_plan', { name: file.name, data });
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
                    fileId: fileData.fileId,
                    fileName: fileData.name,
                    creationDate: fileData.creationDate || new Date().toISOString(),
                    modifiedDate: fileData.modifiedDate || new Date().toISOString(),
                    electrodes: fileData.data.data  // Preserve loaded electrode data
                }
            };
            
            console.log('Created new tab with state:', newTab.state);
            
            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
        } else {
            // Fallback to basic tab creation
            addTab(type, { name: fileData.name });
        }
    };

    const renderTabContent = () => {
        const currentTab = tabs.find(tab => tab.id === activeTab);
        
        switch (currentTab.content) {
            case 'home':
                return (
                    <div className="h-screen flex justify-around items-baseline">
                        {token ? (
                            <>
                                <Left />
                                <Center 
                                    token={token} 
                                    onNewLocalization={() => addTab('localization')}
                                    onNewDesignation={() => addTab('designation')}
                                    onFileUpload={handleFileUpload}
                                    error={error}
                                />
                                <Right onOpenFile={openSavedFile} />
                            </>
                        ) : (
                            <Center 
                                onNewLocalization={() => addTab('localization')}
                                onNewDesignation={() => addTab('designation')}
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
            case 'csv-test_plan':
                return (
                    <div className="p-4">
                        <h2 className="text-2xl font-bold mb-4">{currentTab.data.name}</h2>
                        <table className="w-full border-collapse border">
                            <thead>
                                <tr>
                                    {Object.keys(currentTab.data.data[0] || {}).map((key) => (
                                        <th key={key} className="border p-2">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentTab.data.data.map((row, index) => (
                                    <tr key={index}>
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="border p-2">{value}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="flex border-b">
                {tabs.map(tab => (
                    <Tab
                        key={tab.id}
                        title={tab.title}
                        isActive={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        onClose={() => closeTab(tab.id)}
                        onRename={(newTitle) => renameTab(tab.id, newTitle)}
                    />
                ))}
                <button 
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => addTab('localization')}
                >
                    +
                </button>
            </div>
            {token && <UserProfile onSignOut={handleSignOut} />}

            <div className="flex-1">
                {renderTabContent()}
            </div>
        </div>
    );
};

const Center = ({ token, onNewLocalization, onNewDesignation, onFileUpload, error }) => {
    return (
        <div className="h-screen basis-150 flex flex-col justify-center items-center">
            {token && 
                <>
                    <button className="bg-white text-blue-500 border-solid border-1 border-blue-300 rounded-full w-64 py-3">
                        Search the Database
                    </button>
                </>
            }
            <Logo />
            {!token && <SignInButtons />}
            <Dropdown 
                closedText="Create New"
                openText="Create New ▾"
                closedClassName="border-solid border-1 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 mt-5"
                openClassName="bg-sky-700 text-white font-semibold rounded-xl w-64 h-12 mt-5"
                options="Localization Stimulation Designation"
                optionClassName="block w-64 py-2 text-sm text-gray-700 hover:bg-gray-100"
                menuClassName="w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                onOptionClick={(option) => {
                    switch(option) {
                        case "Localization":
                            onNewLocalization();
                            break;
                        case "Stimulation":
                            // Add stimulation handling here when needed
                            break;
                        case "Designation":
                            onNewDesignation();
                            break;
                    }
                }}
            />
            <input
                type="file"
                accept=".csv"
                onChange={onFileUpload}
                style={{ display: 'none' }}
                id="fileInput"
            />
            <button 
                className="border-solid border-1 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 my-5 transition-colors duration-200 
                hover:bg-sky-700 hover:text-white"
                onClick={() => document.getElementById('fileInput').click()}
            >
                Open File
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

const Left = () => {
    return (
        <div className="basis-80">
            <h2 className="text-6xl font-bold m-3">My Stuff</h2>
            <ToReview />
            <Approved />
        </div>
    );
};

const Right = ({ onOpenFile }) => {
    const [recentLocalizations, setRecentLocalizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchRecentFiles = async () => {
            setIsLoading(true);
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setRecentLocalizations([]);
                    setIsLoading(false);
                    return;
                }
                
                // Get user ID from session
                const { data: session } = await supabase
                    .from('sessions')
                    .select('user_id')
                    .eq('token', token)
                    .single();
                
                if (!session) {
                    setRecentLocalizations([]);
                    setIsLoading(false);
                    return;
                }
                
                // Fetch files for the current user - limited to 5 most recent
                const { data: files, error } = await supabase
                    .from('files')
                    .select('*')
                    .eq('owner_user_id', session.user_id)
                    .order('modified_date', { ascending: false })
                    .limit(5);
                
                if (error) {
                    console.error('Error fetching recent files:', error);
                    setRecentLocalizations([]);
                } else {
                    setRecentLocalizations(files || []);
                }
            } catch (error) {
                console.error('Error fetching recent files:', error);
                setRecentLocalizations([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchRecentFiles();
    }, []);
    
    const handleFileClick = async (file) => {
        try {
            // Show loading state in the UI
            const fileElement = document.getElementById(`file-${file.file_id}`);
            if (fileElement) {
                fileElement.classList.add('text-sky-600');
                fileElement.querySelector('.filename').innerText = "Loading...";
            }
            
            console.log(`Attempting to load file ID: ${file.file_id} (${file.filename})`);
            
            // First check if we can find any localization records with this file_id
            const { data: checkData, error: checkError } = await supabase
                .from('localization')
                .select('id, file_id')
                .eq('file_id', file.file_id)
                .limit(1);
                
            if (checkError) {
                console.error('Error checking localization data:', checkError);
                alert(`Database error: ${checkError.message}`);
                return;
            }
            
            console.log('Check result:', checkData);
            
            if (!checkData || checkData.length === 0) {
                console.warn(`No localization records found with file_id=${file.file_id}`);
                
                // Let's check what file_ids exist in the localization table
                const { data: sampleData } = await supabase
                    .from('localization')
                    .select('file_id')
                    .limit(10);
                    
                console.log('Sample file_ids in localization table:', sampleData);
                
                // Create a new tab anyway with empty data
                console.log('Creating new tab with empty data for:', file.filename);
                onOpenFile('localization', { 
                    name: file.filename || 'Unnamed Localization',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: { data: {} }
                });
                
                return;
            }
            
            // Fetch complete localization data associated with this file_id
            const { data: localizationData, error: locError } = await supabase
                .from('localization')
                .select(`
                    id, contact, tissue_type, file_id,
                    electrode:electrode_id(id, label, description, contact_number),
                    region:region_id(id, name)
                `)
                .eq('file_id', file.file_id);
                
            if (locError) {
                console.error('Error fetching localization data:', locError);
                alert(`Failed to load file data: ${locError.message}`);
                return;
            }
            
            if (!localizationData || localizationData.length === 0) {
                console.warn('No localization data found for file ID:', file.file_id);
                
                // Create a new tab anyway with empty data
                onOpenFile('localization', { 
                    name: file.filename || 'Unnamed Localization',
                    fileId: file.file_id,
                    fileName: file.filename,
                    creationDate: file.creation_date,
                    modifiedDate: file.modified_date,
                    data: { data: {} }
                });
                
                return;
            }
            
            console.log(`Retrieved ${localizationData.length} localization records:`, localizationData);
            
            // Transform the database records into the electrode format used by the Localization component
            const electrodes = transformLocalizationData(localizationData);
            
            // Call the onOpenFile function with the complete data
            onOpenFile('localization', { 
                name: file.filename || 'Unnamed Localization',
                fileId: file.file_id,
                fileName: file.filename,
                creationDate: file.creation_date,
                modifiedDate: file.modified_date,
                data: { data: electrodes }
            });
        } catch (error) {
            console.error('Error loading file:', error);
            alert(`Failed to load file data: ${error.message}`);
        } finally {
            // Reset the loading state if needed
            const fileElement = document.getElementById(`file-${file.file_id}`);
            if (fileElement && fileElement.querySelector('.filename')) {
                fileElement.querySelector('.filename').innerText = file.filename || 'Unnamed Localization';
            }
        }
    };
    
    // Transform database records into the electrode format used by Localization component
    const transformLocalizationData = (dbRecords) => {
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
                    description: description
                };
                console.log(`Created new electrode: ${label}`);
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
        console.log('Transformed electrodes data:', electrodes);
        return electrodes;
    };
    
    return (
        <div className="basis-80 justify-center">
            <h3 className="text-4xl font-bold">Recent Localizations</h3>
            <div className="mb-5">
                {isLoading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : recentLocalizations.length > 0 ? (
                    <div>
                        {recentLocalizations.map((file) => (
                            <div 
                                id={`file-${file.file_id}`}
                                key={file.file_id} 
                                className="py-1 hover:bg-sky-50 hover:text-sky-600 cursor-pointer rounded px-2 transition-colors duration-150 flex justify-between items-center"
                                onClick={() => handleFileClick(file)}
                            >
                                <div className="truncate max-w-[200px] filename">
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
            <h3 className="text-4xl font-bold">Recent Stimulation Plans</h3>
            <div className="mb-5">
                <div className="text-gray-500">No files available</div>
            </div>
        </div>
    );
};

const Logo = () => {
    return (
        <div className="flex flex-col items-center m-5">
            <h1 className="text-8xl font-bold mt-5">Wirecracker</h1>
        </div>
    );
};

export const GoogleSignInButton = () => {
    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    return (
        <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <FcGoogle className="h-5 w-5 mr-2" />
            Sign in with Google
        </button>
    );
};

const SignInButtons = () => {
    return (
        <div>
            <div className="flex m-10">
                <Link to="/signup">
                    <button className="bg-slate-300 font-semibold rounded-xl w-40 py-3 mr-5">Sign Up</button>
                </Link>
                <Link to="/login">
                    <button className="bg-slate-300 font-semibold rounded-xl w-40 py-3">Log In</button>
                </Link>
            </div>
            <div className="flex m-10 justify-center">
                <div className="w-[335px]">
                    <GoogleSignInButton />
                </div>
            </div>
        </div>
    );
};

const ToReview = () => {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    return (
        <div
            className="text-violet-500 text-2xl font-semibold flex gap-x-2"
            onClick={() => setIsReviewOpen(!isReviewOpen)}
        >
            {isReviewOpen ? (
                <>
                    <div className="before:content-['▾']"></div>
                    <div className="mb-5">
                        <div>To Review</div>
                    </div>
                </>
            ) : (
                <>
                    {/* Triangle */}
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
            className="text-green-500 text-2xl font-semibold flex gap-x-2"
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
                    {/* Triangle */}
                    <div className="before:content-['▸']"></div>
                    <div>Approved</div>
                </>
            )}
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="/database/:table" element={<DatabaseTable />} />
                <Route path="/auth-success" element={<GoogleAuthSuccess />} />
            </Routes>
        </Router>
    );
};

export default App;
