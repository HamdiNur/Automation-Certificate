import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./Admin/pages/Dashboard";
import Requests from "./Admin/pages/Request";
import Login from "./Admin/pages/Login";
import StudentDetails from "./Admin/pages/StudentDetails";
import Appointments from "./Admin/pages/Appointments";
import Users from "./Admin/pages/Users";
import Profile from "./Admin/pages/Profile";
import FacultyDashboard from "./facualty/pages/FacultyDashboar";
import FacultyRequests from "./facualty/pages/FacultyRequests";
import FacultyProfile from "./facualty/pages/FacultyProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />


        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
<Route path="/faculty/requests" element={<FacultyRequests />} />
<Route path="/faculty/profile" element={<FacultyProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
