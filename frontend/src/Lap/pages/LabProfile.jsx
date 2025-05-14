import React, { useState } from "react";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"
const dummyLab = {
  name: "Engineer Yusuf Abdi",
  email: "yusuf.abdi@just.edu.so",
  role: "Lab Officer"
};

function LabProfile() {
  const [profile, setProfile] = useState(dummyLab);
  const [editMode, setEditMode] = useState(false);
  const [temp, setTemp] = useState(profile);

  const saveProfile = () => {
    setProfile(temp);
    setEditMode(false);
  };

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
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
      </div>
    </div>
  );
}

export default LabProfile;
