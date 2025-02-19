export default function Home() {}

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