import React, { useEffect, useState } from "react";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css";

function FacultyProfile() {
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

        setFaculty(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        {loading ? (
          <p>Loading profile...</p>
        ) : error ? (
          <p style={{ color: "red" }}>❌ {error}</p>
        ) : (
          <div className="student-card">
            <p><strong>Name:</strong> {faculty.fullName}</p>
            <p><strong>Email:</strong> {faculty.email}</p>
            <p><strong>Department:</strong> {faculty.department || "N/A"}</p>
            <p><strong>Role:</strong> {faculty.role}</p> {/* 👈 NEW */}
          </div>
        )}
      </div>
    </div>
  );
}

export default FacultyProfile;
