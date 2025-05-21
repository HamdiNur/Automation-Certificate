import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Login = () => {
  const [form, setForm] = useState({ userId: "", password: "" });
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

      const { userId, role } = data.user;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);

      const prefix = userId.substring(0, 2).toUpperCase();
      const routeMap = {
        AD: "admin",
        FI: "finance",
        LI: "library",
        LB: "lab",
        EX: "exam_office",
        FA: "faculty",
        ST: "student",
        NU: "student"
      };

      const dashboard = routeMap[prefix];
      if (dashboard) {
        navigate(`/${dashboard}`);
      } else {
        setError("Unknown user ID prefix. Cannot determine role.");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-sm text-center">
        <img src={logo} alt="System Logo" className="w-24 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-indigo-900">UNIVERSITY CERTIFICATE</h2>
        <p className="text-lg font-bold text-indigo-900 mb-6">CLEARANCE SYSTEM</p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">User ID</label>
            <input
              name="userId"
              type="text"
              value={form.userId}
              onChange={handleChange}
              placeholder="User ID"
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-900 text-white py-2 rounded-md font-semibold hover:bg-indigo-950 transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
