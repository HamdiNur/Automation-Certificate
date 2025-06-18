import React, { useState, useEffect } from "react";
import LibrarySidebar from "../components/LibrarySidebar";
import SkeletonProfile from"../../components/loaders/SkeletonProfile"; // adjust the path if needed

import "./styles/style.css";

function LibraryProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [temp, setTemp] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
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

        setProfile(data.user);
        setTemp(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = () => {
    setProfile(temp);
    setEditMode(false);
    // Optional: send PUT request to backend
  };

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>My Profile</h2>

        {loading ? (
  <SkeletonProfile />
        ) : error ? (
          <p style={{ color: "red" }}>❌ {error}</p>
        ) : (
          <div className="student-card">
            {!editMode ? (
              <>
                <p><strong>Name:</strong> {profile.fullName}</p>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <button className="btn-view" onClick={() => setEditMode(true)}>Edit Profile</button>
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
        )}
      </div>
    </div>
  );
}

export default LibraryProfile;
