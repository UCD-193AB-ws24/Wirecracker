import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dropdown from './utils/Dropdown';
import Debug from './pages/Debug';
import DatabaseTable from "./pages/DatabaseTable";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import { parseCSVFile, Identifiers } from './utils/CSVParser';
import Localization from './pages/Localization';

const Tab = ({ title, isActive, onClick, onClose }) => {
    return (
        <div 
            className={`flex items-center px-4 py-2 border-b-2 cursor-pointer ${
                isActive ? 'border-sky-700 text-sky-700' : 'border-transparent'
            }`}
            onClick={onClick}
        >
            <span>{title}</span>
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

const HomePage = () => {
    const token = localStorage.getItem('token') || null;
    const [tabs, setTabs] = useState([{ id: 'home', title: 'Home', content: 'home' }]);
    const [activeTab, setActiveTab] = useState('home');
    const [error, setError] = useState("");
    
    const addTab = (type, data = null) => {
        const newTab = {
            id: Date.now().toString(),
            title: type === 'localization' ? 'New Localization' : data?.name || 'New Tab',
            content: type,
            data: data
        };
        setTabs([...tabs, newTab]);
        setActiveTab(newTab.id);
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
                                <Right />
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
                return <Localization />;
            case 'csv-localization':
                return <Localization initialData={currentTab.data} />;
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
                    />
                ))}
                <button 
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => addTab('localization')}
                >
                    +
                </button>
            </div>

            <div className="flex-1">
                {renderTabContent()}
            </div>
        </div>
    );
};

const Center = ({ token, onNewLocalization, onFileUpload, error }) => {
    return (
        <div className="h-screen basis-150 flex flex-col justify-center items-center">
            {/* Add Link to database search */}
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
                optionRefs="/localization /stimulation"
                optionClassName="block w-64 py-2 text-sm text-gray-700 hover:bg-gray-100"
                menuClassName="w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                onOptionClick={(option) => {
                    if (option === "Localization") onNewLocalization();
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

const Right = () => {
    return (
        <div className="basis-80 justify-center">
            <h3 className="text-4xl font-bold">Recent Localizations</h3>
            <div className="mb-5">
                <div>temp.csv</div>
            </div>
            <h3 className="text-4xl font-bold">Recent Stimulation Plans</h3>
            <div className="mb-5">
                <div>temp.csv</div>
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
                <Route path="/localization" element={<Localization />} />
                <Route path="/stimulation" element={<HomePage />} />
            </Routes>
        </Router>
    );
};

export default App;
