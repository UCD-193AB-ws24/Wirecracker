import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';

function Home() {
    return (
        <div>
            <h1>Welcome to the WireCracker App</h1>
            <Link to="/signup">
                <button>Sign Up</button>
            </Link>
            <Link to="/login">
                <button>Log In</button>
            </Link>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;
