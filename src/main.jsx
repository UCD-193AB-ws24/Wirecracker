import React from "react"
import ReactDOM from "react-dom/client"
import { Center, Left } from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Left />
    <Center />
  </React.StrictMode>,
)