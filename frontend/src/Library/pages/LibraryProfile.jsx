import React, { useState, useEffect } from "react";
import axios from "axios";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function LibraryProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [temp, setTemp] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.user);
        setTemp(res.data.user);
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = () => {
    setProfile(temp);
    setEditMode(false);
    // Optional: send PUT request to backend here
  };

  if (loading) return <div className="dashboard-main">Loading profile...</div>;
  if (!profile) return <div className="dashboard-main">Profile not found.</div>;

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        <div className="student-card">
          {!editMode ? (
            <>
              <p><strong>Name:</strong> {profile.fullName}</p>
              <p><strong>Username:</strong> {profile.username}</p>
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
                value={temp.fullName}
                onChange={(e) => setTemp({ ...temp, fullName: e.target.value })}
                placeholder="Full Name"
              />
              <input
                type="text"
                value={temp.username}
                onChange={(e) => setTemp({ ...temp, username: e.target.value })}
                placeholder="Username"
              />
              <input
                type="email"
                value={temp.email}
                onChange={(e) => setTemp({ ...temp, email: e.target.value })}
                placeholder="Email"
              />
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={saveProfile}>Save</button>
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LibraryProfile;
