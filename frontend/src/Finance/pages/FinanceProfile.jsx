// 📁 src/Finance/pages/FinanceProfile.jsx

import React, { useEffect, useState } from "react";
import FinanceSidebar from "../components/FinanceSidebar";
import { useUser } from "../../context/UserContext"; // ✅ Import context
import "./FinanceProfile.css";
function FinanceProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUser } = useUser();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data.user);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />

      <div className="dashboard-main">
        <h2>My Profile</h2>

        {loading ? (
          <p>Loading profile...</p>
        ) : error ? (
          <p style={{ color: "red" }}>❌ {error}</p>
        ) : (
          <div className="student-card">
            <p><strong>Name:</strong> {profile.fullName}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Department:</strong> {profile.department || "N/A"}</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default FinanceProfile;
