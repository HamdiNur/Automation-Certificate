<<<<<<< HEAD
import React, { useState } from "react";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css"
const dummyFaculty = {
  id: 501,
  name: "Dr. Amina Hussein",
  email: "amina.hussein@just.edu.so",
  department: "Faculty of Science & Engineering",
};

function FacultyProfile() {
  const [profile, setProfile] = useState(dummyFaculty);
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleSave = () => {
    setProfile(tempProfile);
    setEditMode(false);
  };

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordMessage("⚠️ Please fill in all fields.");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordMessage("❌ New passwords do not match.");
      return;
    }

    // Simulate success
    setPasswordMessage("✅ Password updated successfully.");
    setPasswords({ current: "", new: "", confirm: "" });
  };
=======
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
>>>>>>> master

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

<<<<<<< HEAD
        <div className="student-card">
          {!editMode ? (
            <>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Department:</strong> {profile.department}</p>
              <button className="btn-view" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Name"
                value={tempProfile.name}
                onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={tempProfile.email}
                onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Department"
                value={tempProfile.department}
                onChange={(e) => setTempProfile({ ...tempProfile, department: e.target.value })}
              />

              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleSave}>
                  Save
                </button>
                <button className="btn-cancel" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* 🔐 Change Password Section */}
        <div className="student-card">
          <h3>Change Password</h3>
          <input
            type="password"
            placeholder="Current Password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />

          <div className="modal-buttons">
            <button className="btn-confirm" onClick={handlePasswordChange}>
              Update Password
            </button>
          </div>

          {passwordMessage && (
            <p
              style={{
                marginTop: "10px",
                color: passwordMessage.includes("✅") ? "green" : "red",
              }}
            >
              {passwordMessage}
            </p>
          )}
        </div>
=======
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
>>>>>>> master
      </div>
    </div>
  );
}

export default FacultyProfile;
