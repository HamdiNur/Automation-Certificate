// src/pages/Login.jsx
import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");

  const handleLogin = (e) => {
    e.preventDefault();

    // Redirect based on selected role
    if (role === "admin") {
      navigate("/dashboard");
    } else if (role === "faculty") {
      navigate("/faculty/dashboard");
    } else if (role === "lap") {
      navigate("/lap/dashboard");
    } else if (role === "library") {
      navigate("/library/dashboard");
    } else if (role === "finance") {
      navigate("/finance/dashboard");
    } else {
      alert("Invalid role selected.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="left-side">
          <img
            src="../images/login-background.jpg.jpg"
            alt="Background"
            className="background-image"
          />
          <div className="overlay-content">
            <h1>JAMHURIYA</h1>
            <h2>THESIS SYSTEM</h2>
            <p>
              Jamhuriya Technology Solutions - JTech is a professional technology
              solution provider and ICT training center founded by Jamhuriya University
              of Science and Technology in Mogadishu, Somalia.
            </p>
          </div>
        </div>

        <div className="right-side">
          <form onSubmit={handleLogin} className="login-form">
            <h2>Welcome back!</h2>
            <p>Please sign in to continue</p>

            <input type="text" placeholder="Username" required />
            <input type="password" placeholder="Password" required />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="lap">lap</option>
              <option value="library">library</option>
              <option value="finance">financce</option>



            </select>

            <button type="submit">Sign In</button>

            <p className="copyright">
              © 2025 <strong>Jamhuriya Thesis System</strong>. Developed by{" "}
              <strong>Jamhuriya Technology Solutions</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
