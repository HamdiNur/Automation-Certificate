import React, { useEffect, useState } from "react";
import axios from "axios";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function StudentList() {
  const [students, setStudents] = useState([]);

  // 🔹 Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await axios.get("/students");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>👥 Student List</h2>

        <div className="pending-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Program</th>
                <th>Group</th>
                <th>Clearance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.fullName}</td>
                    <td>{student.studentId}</td>
                    <td>{student.program || "—"}</td>
                    <td>{student.groupId?.groupNumber || "—"}</td>
                    <td>
                      <span className={`badge ${
                        student.clearanceStatus === "Approved"
                          ? "badge-success"
                          : student.clearanceStatus === "Rejected"
                          ? "badge-danger"
                          : "badge-pending"
                      }`}>
                        {student.clearanceStatus || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentList;
