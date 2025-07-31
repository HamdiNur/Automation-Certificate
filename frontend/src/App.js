import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth
import Login from "./Admin/pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import Dashboard from "./Admin/pages/Dashboard";
import Requests from "./Admin/pages/Request";
import Appointments from "./Admin/pages/Appointments";
import CoursesPage from "./Admin/pages/CoursesPage";
import ClearedStudents from "./Admin/pages/ClearedStudents";
import Users from "./Admin/pages/Users";
import Profile from "./Admin/pages/Profile";
import NameCorrections from "./Admin/pages/NameCorrections";
import StudentReexamDashboardWrapper from "./Admin/pages/StudentReexamDashboardWrapper";

// Faculty Pages
import FacultyDashboard from "./facualty/pages/FacultyDashboar";
import FacultyRequests from "./facualty/pages/FacultyRequests";
import FacultyProfile from "./facualty/pages/FacultyProfile";
import ApprovedFacultyClearance from "./facualty/pages/ApprovedFacultyClearanc";
import RejectedFacultyClearance from "./facualty/pages/RejectedFacultyClearance";
import GroupMembersPage from "./facualty/pages/GroupMember";
import FacultyChat from "./facualty/pages/FacultyChat";


// Lab Pages
import LabDashboard from "./Lap/pages/LabDashboard";
import LabProfile from "./Lap/pages/LabProfile";
import ApprovedLabClearances from "./Lap/pages/ApprovedLabClearances";
import RejectedLabReturns from "./Lap/pages/RejectedLabReturns";
import LabChat from "./Lap/pages/LabChat";

import LabGroupDetails from "./Lap/pages/GroupDetails";

// Library Pages
import LibraryDashboard from "./Library/pages/LibraryDashboard";
import LibraryBooks from "./Library/pages/LibraryBooks";
import LibraryProfile from "./Library/pages/LibraryProfile";
import ApprovedSubmissions from "./Library/pages/ApprovedSubmissions";
import RejectedSubmissions from "./Library/pages/RejectedSubmissions";
import LibraryChat from "./Library/pages/LibraryChat";

import GroupDetails from "./Library/pages/GroupDetails";

// Finance Pages
import FinanceDashboard from "./Finance/pages/FinanceDashboard";
import FinancePayments from "./Finance/pages/FinancePayments";
import FinanceProfile from "./Finance/pages/FinanceProfile";
import PendingApprovals from "./Finance/pages/PendingApprovals";
import GraduationPaid from "./Finance/pages/GraduationPaid";
import FinanceChat from "./Finance/pages/FinanceChat";
import ExaminationChat from "./Admin/pages/ExaminationChat";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/students/:id" element={<ClearedStudents />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/name-corrections" element={<NameCorrections />} />
          <Route path="/re-exam/:studentId" element={<StudentReexamDashboardWrapper />} />
          <Route path="/examination/chat" element={< ExaminationChat/>} />


          {/* Faculty */}
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/requests" element={<FacultyRequests />} />
          <Route path="/faculty/approved" element={<ApprovedFacultyClearance />} />
          <Route path="/faculty/rejected" element={<RejectedFacultyClearance />} />
          <Route path="/faculty/group-members" element={<GroupMembersPage />} />
          <Route path="/faculty/group/:groupId/members" element={<GroupMembersPage />} />
          <Route path="/faculty/profile" element={<FacultyProfile />} />
          <Route path="/faculty/chat" element={<FacultyChat />} /> {/* ✅ New chat route */}


          {/* Lab */}
          <Route path="/lab/dashboard" element={<LabDashboard />} />
          <Route path="/lab/profile" element={<LabProfile />} />
          <Route path="/lab/approved" element={<ApprovedLabClearances />} />
          <Route path="/lab/rejected" element={<RejectedLabReturns />} />
          <Route path="/lab/chat" element={<LabChat />} /> 

          <Route path="/lab/group/:groupId" element={<LabGroupDetails />} />

          {/* Library */}
          <Route path="/library/dashboard" element={<LibraryDashboard />} />
          <Route path="/library/books" element={<LibraryBooks />} />
          <Route path="/library/profile" element={<LibraryProfile />} />
          <Route path="/library/approved" element={<ApprovedSubmissions />} />
          <Route path="/library/rejected" element={<RejectedSubmissions />} />
          <Route path="/library/chat" element={<LibraryChat />} />

          <Route path="/library/group/:groupId" element={<GroupDetails />} />

          {/* Finance */}
          <Route path="/finance/dashboard" element={<FinanceDashboard />} />
          <Route path="/finance/payments" element={<FinancePayments />} />
          <Route path="/finance/profile" element={<FinanceProfile />} />
          <Route path="/finance/pending" element={<PendingApprovals />} />
          <Route path="/finance/graduation-paid" element={<GraduationPaid />} />
          <Route path="/finance/chat" element={<FinanceChat />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<div style={{ padding: 50 }}><h2>404 - Page Not Found</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;
