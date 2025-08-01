// 📁 src/Finance/pages/FinanceProfile.jsx

import React, { useEffect } from "react";
import FinanceSidebar from "../components/FinanceSidebar";
import { useDispatch } from "react-redux";
import { useGetProfileQuery } from "../../redux/api/authApi"; // ✅ RTK Query hook
import { setCredentials } from "../../redux/slices/authSlice"; // ✅ Optional
import "./FinanceProfile.css";

function FinanceProfile() {
  const dispatch = useDispatch();

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useGetProfileQuery();

  // ✅ Optional: Store in authSlice and localStorage
  useEffect(() => {
    if (profileData?.user) {
      dispatch(setCredentials({ user: profileData.user, token: localStorage.getItem("token") }));
      localStorage.setItem("user", JSON.stringify(profileData.user));
    }
  }, [profileData, dispatch]);

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />

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
            <p><strong>Role:</strong> {profileData?.user?.role}</p>
            <p><strong>Department:</strong> {profileData?.user?.department || "N/A"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinanceProfile;
