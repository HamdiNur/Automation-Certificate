import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Admin Pages
import Dashboard from "./Admin/pages/Dashboard";
import Requests from "./Admin/pages/Request";
import Login from "./Admin/pages/Login";
import StudentDetails from "./Admin/pages/StudentDetails";
import Appointments from "./Admin/pages/Appointments";
import CoursesPage from "./Admin/pages/CoursesPage"; // 


import Users from "./Admin/pages/Users";
import Profile from "./Admin/pages/Profile";
import NameCorrections from "./Admin/pages/NameCorrections";

// Faculty Pages
import FacultyDashboard from "./facualty/pages/FacultyDashboar";
import FacultyRequests from "./facualty/pages/FacultyRequests";
import FacultyProfile from "./facualty/pages/FacultyProfile";
import ApprovedFacultyClearance from "./facualty/pages/ApprovedFacultyClearanc";
import RejectedFacultyClearance from "./facualty/pages/RejectedFacultyClearance";


// Lab Pages
import LabDashboard from "./Lap/pages/LabDashboard";
import LabEquipment from "./Lap/pages/LabEquipment";
import LabProfile from "./Lap/pages/LabProfile";
import ApprovedLabClearances from "./Lap/pages/ApprovedLabClearances";
import RejectedLabReturns from "./Lap/pages/RejectedLabReturns";

// Library Pages
import LibraryDashboard from "./Library/pages/LibraryDashboard";
import LibraryBooks from "./Library/pages/LibraryBooks";
import LibraryProfile from "./Library/pages/LibraryProfile";
import ApprovedSubmissions from "./Library/pages/ApprovedSubmissions";
import RejectedSubmissions from "./Library/pages/RejectedSubmissions";
import StudentList from "./Library/pages/StudentList";
import GroupDetails from "./Library/pages/GroupDetails";

// Finance Pages
import FinanceDashboard from "./Finance/pages/FinanceDashboard";
import FinancePayments from "./Finance/pages/FinancePayments";
import FinanceProfile from "./Finance/pages/FinanceProfile";
import PendingApprovals from "./Finance/pages/PendingApprovals";
import GraduationPaid from "./Finance/pages/GraduationPaid";
import StudentReexamDashboardWrapper from "./Admin/pages/StudentReexamDashboardWrapper";
import GroupMembersPage from "./facualty/pages/GroupMember";
import FinanceChat from "./Finance/pages/FinanceChat";
import LabGroupDetails from "./Lap/pages/GroupDetails";


function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Admin */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/courses" element={<CoursesPage />} />
<Route path="/re-exam/:studentId" element={<StudentReexamDashboardWrapper />} />


        <Route path="/appointments" element={<Appointments />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/name-corrections" element={<NameCorrections />} />

        {/* Faculty */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/requests" element={<FacultyRequests />} />
        <Route path="/faculty/approved" element={<ApprovedFacultyClearance />} />
        <Route path="/faculty/rejected" element={<RejectedFacultyClearance />} />
        <Route path="/faculty/group/:groupId/members" element={<GroupMembersPage />} />
+       <Route path="/faculty/group-members" element={<GroupMembersPage />} />



        <Route path="/faculty/profile" element={<FacultyProfile />} />

        {/* Lab */}
       <Route path="/lab/dashboard" element={<LabDashboard />} />
       <Route path="/lab/equipment" element={<LabEquipment />} />
     <Route path="/lab/profile" element={<LabProfile />} />
<Route path="/lab/approved" element={<ApprovedLabClearances />} />
<Route path="/lab/rejected" element={<RejectedLabReturns />} />
<Route path="/lab/group/:groupId" element={<LabGroupDetails />} />


        {/* Library */}
        <Route path="/library/dashboard" element={<LibraryDashboard />} />
        <Route path="/library/books" element={<LibraryBooks />} />
        <Route path="/library/profile" element={<LibraryProfile />} />
        <Route path="/library/approved" element={<ApprovedSubmissions />} />
        <Route path="/library/rejected" element={<RejectedSubmissions />} />
        <Route path="/library/students" element={<StudentList />} />
        <Route path="/library/group/:groupId" element={<GroupDetails />} />

        {/* Finance */}
        <Route path="/finance/chat" element={<FinanceChat />} /> {/* 🆕 Chat Inbox */}
        <Route path="/finance/dashboard" element={<FinanceDashboard />} />
        <Route path="/finance/payments" element={<FinancePayments />} />
        <Route path="/finance/pending" element={<PendingApprovals />} />
        <Route path="/finance/graduation-paid" element={<GraduationPaid />} />
        <Route path="/finance/profile" element={<FinanceProfile />} />
        

        {/* 404 Not Found */}
        <Route path="*" element={<div style={{ padding: 50 }}><h2>404 - Page Not Found</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;
