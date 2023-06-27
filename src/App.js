import "./App.css";

import { BrowserRouter, Route, Routes, Link } from "react-router-dom";

//import JournalItemEdit from 'Components/JournalItemEdit';
// //import NewMeeting from 'Components/NewItem';
import Home from "Components/Home";
import Main from "Components/Main";
import Login from "Session/Login";
import Image from "Components/Image";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./Session/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/Login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/List" element={<Main />} />
            <Route path="/Image" element={<Image />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </div>
    </AuthProvider>
  );
}

export default App;
