<<<<<<< HEAD
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
    } else if (role === "lab") {
      navigate("/lab/dashboard");
    } else if (role === "library") {
      navigate("/library/dashboard");
    } else if (role === "finance") {
      navigate("/finance/dashboard");
    } else {
      alert("Invalid role selected.");
=======
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import bgImage from "../../assets/logo.jpg";
import logo from "../../assets/jam.png";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" }); // ✅ FIXED
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      const { token, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("username", user.username);

      // ✅ Role-based redirect
      const routeMap = {
        admin: "dashboard",
        finance: "finance/dashboard",
        library: "library/dashboard",
        lab: "lab/dashboard",
        exam_office: "dashboard",
        faculty: "faculty/dashboard",
        student: "student",
      };

      const dashboard = routeMap[user.role];
      if (dashboard) {
        navigate(`/${dashboard}`);
      } else {
        setError("Unknown user role. Cannot redirect.");
      }
    } catch (err) {
      setError(err.message || "Login failed");
>>>>>>> master
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
<<<<<<< HEAD
        <div className="left-side">
          <img
            src="../images/login-background.jpg.jpg"
            alt="Background"
            className="background-image"
          />
=======
        {/* LEFT SIDE */}
        <div className="left-side">
          <img src={bgImage} alt="Library Background" className="background-image" />
>>>>>>> master
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

<<<<<<< HEAD
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
              <option value="lab">lab</option>
              <option value="library">library</option>
              <option value="finance">financce</option>



            </select>

            <button type="submit">Sign In</button>

            <p className="copyright">
              © 2025 <strong>Jamhuriya Thesis System</strong>. Developed by{" "}
=======
        {/* RIGHT SIDE */}
        <div className="right-side">
          <form onSubmit={handleSubmit} className="login-form">
            <img src={logo} alt="JUST Logo" className="login-logo" />
            <h2>MyJUST Login</h2>
            {error && <p className="error">{error}</p>}

            <input
              type="text"
              name="username"
              placeholder="Username or Student ID"
              value={form.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button type="submit">SIGN IN</button>

            <p className="copyright">
              © 2025 Jamhuriya Thesis System. Developed by{" "}
>>>>>>> master
              <strong>Jamhuriya Technology Solutions</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
};
>>>>>>> master

export default Login;
