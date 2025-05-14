import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // Replace with your actual logo path

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "", role: "admin" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // ✅ Temporary: Skip backend, set role and token manually
    const role = form.role.toLowerCase();
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem("role", role);

    // ✅ Redirect to lowercase route
    if (role === "faculty") {
      navigate("/faculty");
    } else if (role === "admin") {
      navigate("/admin");
    } else if (role === "library") {
      navigate("/library");
    } else if (role === "lab") {
      navigate("/lab");
    } else if (role === "finance") {
      navigate("/finance");
    } else if (role === "examination") {
      navigate("/examination");
    } else {
      setError("Unknown role selected");
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
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="library">Library</option>
              <option value="lab">Lab</option>
              <option value="finance">Finance</option>
              <option value="examination">Examination</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
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
