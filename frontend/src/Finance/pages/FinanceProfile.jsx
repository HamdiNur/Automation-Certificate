import React, { useState } from "react";
import FinanceSidebar from "../components/FinanceSidebar";

const dummyFinance = {
  name: "Mr. Ibrahim Ahmed",
  email: "ibrahim.finance@just.edu.so",
  role: "Finance Officer"
};

function FinanceProfile() {
  const [profile, setProfile] = useState(dummyFinance);
  const [editMode, setEditMode] = useState(false);
  const [temp, setTemp] = useState(profile);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);

  const saveProfile = () => {
    setProfile(temp);
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

    setPasswordMessage("✅ Password updated successfully.");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        {/* Profile Card */}
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
                value={temp.name}
                onChange={(e) => setTemp({ ...temp, name: e.target.value })}
              />
              <input
                type="email"
                value={temp.email}
                onChange={(e) => setTemp({ ...temp, email: e.target.value })}
              />
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={saveProfile}>Save</button>
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
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

export default FinanceProfile;
