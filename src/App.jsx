import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';

function Center() {
    const token = localStorage.getItem('token');

    return (
        <div className="flex flex-col justify-center items-center">
            <Logo />
            {!token && <SignInButtons />}
        </div>
    )
}

function Logo() {
    return (
        <div className="flex flex-col items-center m-15">
            <img alt="Logo"/>
            <h1 className="text-8xl mt-5">Wirecracker</h1>
        </div>
    )
}

function SignInButtons() {
    return (
        <div className="flex">
            <Link to="/signup">
                <button className="bg-slate-300 text-2xl px-5 py-3 rounded mr-5">Sign Up</button>
            </Link>
            <Link to="/login">
                <button className="bg-slate-300 text-2xl px-5 py-3 rounded">Log In</button>
            </Link>
        </div>
    )
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Center />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;
