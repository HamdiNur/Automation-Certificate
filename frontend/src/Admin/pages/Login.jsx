import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginMutation } from "../../redux/api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import bgImage from "../../assets/logo.jpg";
import logo from "../../assets/jam.png";
import "./Login.css";

// ✅ Zod schema
const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (formData) => {
    try {
      const { token, user } = await login(formData).unwrap();
      dispatch(setCredentials({ token, user }));
      localStorage.setItem("userMongoId", user.id); // ✅ Store for dashboard approvals


      const routeMap = {
        admin: "dashboard",
        finance: "finance/dashboard",
        library: "library/dashboard",
        lab: "lab/dashboard",
        exam_office: "dashboard",
        faculty: "faculty/dashboard",
      };

      const dashboard = routeMap[user.role];
      if (dashboard) {
        navigate(`/${dashboard}`);
      } else {
        alert("Unknown user role. Cannot redirect.");
      }
    } catch (err) {
      alert(err?.data?.message || "Login failed");
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
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <img src={logo} alt="JUST Logo" className="login-logo" />
            <h2>MyJUST Login</h2>

            <input
              type="text"
              placeholder="Username or Student ID"
              {...register("username")}
            />
            {errors.username && <p className="error">{errors.username.message}</p>}

            <input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
            {errors.password && <p className="error">{errors.password.message}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "SIGN IN"}
            </button>

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
