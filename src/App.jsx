import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';

function HomePage() {
    const hasToken = localStorage.getItem('token') || null;
    
    return (
        <div className="flex justify-center items-center">
            {hasToken ? (
                <>
                    <Left />
                    <Center />
                </>
            ) : (
                <>
                    <Center />
                </>
            )}
        </div>
    )
}

function Center(props) {
    const token = localStorage.getItem('token');

    return (
        <div className="flex flex-col justify-center items-center">
            <Logo />
            {!props.hasToken && <SignInButtons />}
        </div>
    )
}

function Left() {
    return (
        <div>
            <h2 className="text-6xl mb-10">My Stuff</h2>
            <ToReview />
            <Approved />
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

function ToReview() {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    return (
        <div
            className="text-violet-500 text-2xl flex gap-x-2"
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
    )
}

function Approved() {
    const [isApprovedOpen, setIsApprovedOpen] = useState(false);

    return (
        <div
            className="text-green-500 text-2xl flex gap-x-2"
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
    )
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;
