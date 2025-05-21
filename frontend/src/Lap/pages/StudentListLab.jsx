import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"; // ✅ Make sure the path is correct based on your folder

function StudentListLab() {
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/students/with-lab-status"); // ✅ Updated API
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students with lab status", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>🧪 Lab Student List</h2>

        <div className="pending-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Program</th>
                <th>Group</th>
                <th>Lab Clearance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5">No students found.</td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student._id}>
                    <td>{student.fullName}</td>
                    <td>{student.studentId}</td>
                    <td>{student.program || "—"}</td>
                    <td>{student.groupNumber || "—"}</td>
                    <td>
                      <span className={`badge ${
                        student.labStatus === "Approved"
                          ? "badge-success"
                          : student.labStatus === "Rejected"
                          ? "badge-danger"
                          : "badge-pending"
                      }`}>
                        {student.labStatus}
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

export default StudentListLab;
