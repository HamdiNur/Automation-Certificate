import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

// ✅ API call to fetch profile
const fetchProfile = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/users/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

  return data.user;
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState({});
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await fetchProfile();
        setProfile(user);
        setTempProfile(user);
      } catch (err) {
        console.error("Failed to load profile:", err.message);
      }
    };

    loadProfile();
  }, []);

  const handleSave = () => {
    // You can later connect this to backend update profile API
    setProfile(tempProfile);
    setEditMode(false);
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        {!profile ? (
          <p>Loading profile...</p>
        ) : (
          <>
            <div className="student-card">
              {!editMode ? (
                <>
                  <p>
                    <strong>Name:</strong> {profile.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {profile.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {profile.role}
                  </p>
                  <button className="btn-view" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Name"
                    value={tempProfile.fullName}
                    onChange={(e) =>
                      setTempProfile({ ...tempProfile, fullName: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={tempProfile.email}
                    onChange={(e) =>
                      setTempProfile({ ...tempProfile, email: e.target.value })
                    }
                  />
                  <p>
                    <strong>Role:</strong> {profile.role}
                  </p>
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
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
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

                    // Future: Send to backend for update
                    setPasswordMessage("✅ Password updated successfully.");
                    setPasswords({ current: "", new: "", confirm: "" });
                  }}
                >
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
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
