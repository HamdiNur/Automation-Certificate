import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext"; // ✅ context
import "./Login.css";
import bgImage from "../../assets/logo.jpg";
import logo from "../../assets/jam.png";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser(); // ✅ from context

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

      // ✅ Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userMongoId", user.id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("user", JSON.stringify(user)); // ✅ full user for context

      // ✅ Update context globally
      setUser(user);

      // ✅ Redirect by role
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
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE */}
        <div className="left-side">
          <img src={bgImage} alt="Library Background" className="background-image" />
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
              <strong>Jamhuriya Technology Solutions</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
