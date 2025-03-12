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

        let tabTitle;
        if (type === 'localization') {
            tabTitle = `Localization${localizationCounter}`;
            setLocalizationCounter(prevCounter => prevCounter + 1);
        } else {
            tabTitle = data?.name || 'New Tab';
        }

        const newTab = {
            id: Date.now().toString(),
            title: tabTitle,
            content: type,
            data: data,
            state: {
                fileId: generateUniqueId(),
                fileName: tabTitle,
                creationDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            }
        };
        setTabs([...tabs, newTab]);
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
                addTab('csv-localization', { type: 'localization', data });
            } else {
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
        // For now, this just opens a new tab with the file name
        // In a real implementation, you'd load the actual data
        addTab(type, { name: fileData.fileName });
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
                                    onFileUpload={handleFileUpload}
                                    error={error}
                                />
                                <Right onOpenFile={openSavedFile} />
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

const Center = ({ token, onNewLocalization, onFileUpload, error }) => {
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
                options="Localization Stimulation"
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
                
                // Fetch files for the current user
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
    
    return (
        <div className="basis-80 justify-center">
            <h3 className="text-4xl font-bold">Recent Localizations</h3>
            <div className="mb-5">
                {isLoading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : recentLocalizations.length > 0 ? (
                    <div>
                        {recentLocalizations.map((file) => (
                            <div key={file.file_id} className="py-1 hover:text-sky-600 cursor-pointer">
                                {file.filename || 'Unnamed Localization'}
                                <span className="text-xs text-gray-500 ml-2">
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
                <a href="http://localhost:5000/auth/google">
                    <button className="bg-blue-500 font-semibold rounded-xl w-40 py-3">
                        Sign in with Google
                    </button>
                </a>
            </div>
        </div>
    );;
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
