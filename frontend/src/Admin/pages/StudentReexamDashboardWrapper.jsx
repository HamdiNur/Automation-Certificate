import React from "react";
import { useParams } from "react-router-dom";
import StudentReexamDashboard from "./StudentReexamDashboard";

// Extracts studentId from URL and passes to reusable component
export default function StudentReexamDashboardWrapper() {
  const { studentId } = useParams();
  return <StudentReexamDashboard studentId={studentId} />;
}
