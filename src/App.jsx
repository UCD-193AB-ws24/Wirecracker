import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';

export function HomePage() {}

export function Center() {
  return (
    <div className="flex-col justify-center">
      <Logo />
      <Login />
    </div>
  )
}

export function Left() {
  return (
    <div>
      <h2>My Stuff</h2>
      <ToReview />
    </div>
  )
}

function Logo() {
  return (
    <div>
      <img alt="Logo"/>
      <h1>Wirecracker</h1>
    </div>
  )
}

function Login() {
  return (
    <div>
      {/* Enable and change onClick when login added */}
      <button
        className="bg-slate-300 px-5 py-3 rounded"
        disabled
        onClick={() => alert("Feature not available.") }
      >
        Login
      </button>
    </div>
  )
}

function ToReview() {
  return (
    <div className="text-violet-500 flex gap-x-2">
      {/* Triangle */}
      <div class="before:content-['▸']"></div>
      <p>To Review</p>
    </div>
  )
}
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
