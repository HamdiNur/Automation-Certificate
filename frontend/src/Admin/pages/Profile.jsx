// 📁 src/User/pages/Profile.jsx

import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useGetProfileQuery } from "../../redux/api/authApi"; // ✅ RTK Query
import { setCredentials } from "../../redux/slices/authSlice"; // ✅ Store in Redux

function Profile() {
  const dispatch = useDispatch();

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useGetProfileQuery();

  useEffect(() => {
    if (profileData?.user) {
      dispatch(setCredentials({ user: profileData.user, token: localStorage.getItem("token") }));
      localStorage.setItem("user", JSON.stringify(profileData.user));
    }
  }, [profileData, dispatch]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-main">
        <h2>My Profile</h2>

        {isLoading ? (
          <p>Loading profile...</p>
        ) : isError ? (
          <p style={{ color: "red" }}>❌ {error?.data?.message || "Failed to fetch profile"}</p>
        ) : (
          <div className="student-card">
            <p><strong>Name:</strong> {profileData?.user?.fullName}</p>
            <p><strong>Email:</strong> {profileData?.user?.email}</p>
            <p><strong>Department:</strong> {profileData?.user?.department || "N/A"}</p>
            <p><strong>Role:</strong> {profileData?.user?.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
