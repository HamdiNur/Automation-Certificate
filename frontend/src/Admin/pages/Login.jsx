// src/pages/Login.jsx
import React from "react";
import "./Login.css"; // We'll create this next
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard"); // After login, go to dashboard
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="left-side">
          <img
            src="../images/login-background.jpg.jpg" // Or use your uploaded path
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
