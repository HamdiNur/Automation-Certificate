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

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

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
      </div>
    </div>
  );
}

export default FacultyProfile;
