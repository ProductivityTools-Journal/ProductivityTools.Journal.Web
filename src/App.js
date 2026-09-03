import "./App.css";

import { BrowserRouter, Route, Routes, Link } from "react-router-dom";

//import JournalItemEdit from 'Components/JournalItemEdit';
// //import NewMeeting from 'Components/NewItem';
import Home from "Components/Home";
import Main from "Components/Main";
import Login from "Session/Login";
import Image from "Components/Image";
import Report from "Components/Report";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./Session/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/Login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="/List" element={<Main />} />
              <Route path="/Image" element={<Image />} />
              <Route path="/raport/:guid" element={<Report />} />
              <Route path="/report/:guid" element={<Report />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
