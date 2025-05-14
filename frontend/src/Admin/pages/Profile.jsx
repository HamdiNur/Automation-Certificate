import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const dummyProfile = {
  id: 100,
  name: "System Admin",
  email: "admin@just.edu.so",
  role: "Super Admin",
};

function Profile() {
  const [profile, setProfile] = useState(dummyProfile);
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  const handleSave = () => {
    setProfile(tempProfile);
    setEditMode(false);
  };

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        <div className="student-card">
          {!editMode ? (
            <>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
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
              <p><strong>Role:</strong> {profile.role}</p>

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
    <button
      className="btn-confirm"
      onClick={() => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
          setPasswordMessage("Please fill in all fields.");
          return;
        }
        if (passwords.new !== passwords.confirm) {
          setPasswordMessage("New passwords do not match.");
          return;
        }
        // You would normally send request here
        setPasswordMessage("✅ Password updated successfully.");
        setPasswords({ current: "", new: "", confirm: "" });
      }}
    >
      Update Password
    </button>
  </div>

  {passwordMessage && (
    <p style={{ marginTop: "10px", color: passwordMessage.includes("✅") ? "green" : "red" }}>
      {passwordMessage}
    </p>
  )}
</div>

      </div>
    </div>
  );
}

export default Profile;
