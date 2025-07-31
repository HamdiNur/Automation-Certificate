"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useLoginMutation } from "../../redux/api/authApi"
import { useDispatch } from "react-redux"
import { setCredentials } from "../../redux/slices/authSlice"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, GraduationCap } from "lucide-react"
import "./Login.css"

// ✅ Zod schema
const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (formData) => {
    try {
      const { token, user } = await login(formData).unwrap()
      dispatch(setCredentials({ token, user }))
      localStorage.setItem("userMongoId", user.id) // ✅ Store for dashboard approvals

      const routeMap = {
        admin: "dashboard",
        finance: "finance/dashboard",
        library: "library/dashboard",
        lab: "lab/dashboard",
        exam_office: "dashboard",
        faculty: "faculty/dashboard",
        registrar: "registrar/dashboard",
        student: "student/dashboard",
      }

      const dashboard = routeMap[user.role]
      if (dashboard) {
navigate(`/${dashboard}`)
      } else {
        alert("Unknown user role. Cannot redirect.")
      }
    } catch (err) {
      alert(err?.data?.message || "Login failed")
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE */}
        <div className="left-side">
          <div className="background-decorations">
            {/* Flowing lines */}
            <svg className="flowing-line-1" viewBox="0 0 200 200">
              <path
                d="M20,50 Q50,20 80,50 T140,50 Q170,80 140,110 T80,110 Q50,140 80,170 T140,170"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            <svg className="flowing-line-2" viewBox="0 0 200 200">
              <path
                d="M30,80 Q80,30 130,80 T180,80 Q150,130 100,100 T50,100 Q80,150 130,120"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            {/* Graduation caps */}
            <GraduationCap className="grad-cap grad-cap-1" />
            <GraduationCap className="grad-cap grad-cap-2" />
            <GraduationCap className="grad-cap grad-cap-3" />
            <GraduationCap className="grad-cap grad-cap-4" />

            {/* Geometric shapes */}
            <div className="geometric-shape circle-1"></div>
            <div className="geometric-shape circle-2"></div>
            <div className="geometric-shape dot-1"></div>
            <div className="geometric-shape dot-2"></div>
            <div className="geometric-shape dot-3"></div>
            <div className="plus-sign plus-1">+</div>
            <div className="plus-sign plus-2">+</div>

            {/* Dotted pattern */}
            <div className="dotted-pattern">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="pattern-dot"></div>
              ))}
            </div>
          </div>

          <div className="overlay-content">
            <div className="portal-header">
              <GraduationCap className="portal-icon" />
              <h1>Graduation Portal</h1>
            </div>
            <h2>Welcome back!</h2>
            <p>
              University Certificate Clearance Portal. Secure access to manage graduation eligibility, departmental
              approvals, and certificate issuance.
            </p>
            <div className="features">
              <div className="feature-item">
                <GraduationCap className="feature-icon" />
                <span>Certificate Verification</span>
              </div>
              <div className="feature-dot"></div>
              <span>Secure Portal</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right-side">
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="form-header">
              <h3>Sign In</h3>
              <p>Access Clearance portal</p>
            </div>

            <div className="input-group">
              <label htmlFor="username">Username or Email</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register("username")}
                className={errors.username ? "error-input" : ""}
              />
              {errors.username && <p className="error-message">{errors.username.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={errors.password ? "error-input" : ""}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="error-message">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="submit-button">
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login