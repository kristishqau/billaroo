import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import styles from "./Login.module.css"
import { useAuth } from "../../context/AuthContext"
import axios from "../../api/axios"
import { Eye, EyeOff } from 'lucide-react';

type LoginForm = {
  username: string
  password: string
  rememberMe: boolean
}

type LoginResponse = {
  id: number
  username: string
  email: string
  role: string
  token: string
  isEmailVerified: boolean
  lastLoginAt?: string
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ 
    username: "", 
    password: "",
    rememberMe: false 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for success messages from other pages
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const message = urlParams.get('message')
    if (message === 'password-reset-success') {
      setSuccessMessage("Your password has been reset successfully. Please log in with your new password.")
    } else if (message === 'email-verified') {
      setSuccessMessage("Your email has been verified successfully. You can now log in.")
    }
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const response = await axios.post<LoginResponse>("/Auth/login", {
        username: form.username,
        password: form.password
      })
      const user = response.data
      
      // Handle remember me functionality
      if (form.rememberMe) {
        localStorage.setItem("rememberUser", form.username)
      } else {
        localStorage.removeItem("rememberUser")
      }
      
      login(user)
      
      // Show welcome back message if user has logged in before
      if (user.lastLoginAt) {
        setSuccessMessage(`Welcome back, ${user.username}!`)
        setTimeout(() => {
          navigateBasedOnRole(user.role)
        }, 1000)
      } else {
        // First time login
        setSuccessMessage(`Welcome to Billaroo, ${user.username}!`)
        setTimeout(() => {
          navigateBasedOnRole(user.role)
        }, 1500)
      }
      
    } catch (err: any) {
      console.error('Login error:', err)
      
      let errorMessage = "Login failed. Please try again."
      
      if (err.response?.status === 400) {
        const responseData = err.response.data
        
        if (typeof responseData === 'string') {
          errorMessage = responseData
        }
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' 
          ? err.response.data 
          : err.response.data.message || errorMessage
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const navigateBasedOnRole = (role: string) => {
    const from = location.state?.from?.pathname || '/home'
    if (role === 'freelancer') {
      navigate(from)
    } else {
      navigate('/client-dashboard') // Different dashboard for clients
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
    
    // Clear success message when editing form
    if (successMessage) {
      setSuccessMessage("")
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Load remembered username on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberUser")
    if (rememberedUser) {
      setForm(prev => ({ ...prev, username: rememberedUser, rememberMe: true }))
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Billaroo</h1>
            <div className={styles.tagline}>Freelancer Management Platform</div>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.rememberSection}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {successMessage && (
            <div className={styles.success} role="alert">
              <span className={styles.successIcon}>✅</span>
              {successMessage}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || !form.username || !form.password}
          >
            {loading && <span className={styles.spinner}></span>}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.demoSection}>
          <p className={styles.demoText}>Try it out with demo accounts:</p>
          <div className={styles.demoButtons}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => setForm(prev => ({ ...prev, username: "demo_freelancer", password: "demo123" }))}
              disabled={loading || accountLocked}
            >
              Demo Freelancer
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => setForm(prev => ({ ...prev, username: "demo_client", password: "demo123" }))}
              disabled={loading || accountLocked}
            >
              Demo Client
            </button>
          </div>
        </div> */}

        <div className={styles.footer}>
          <p>
            Don't have an account?{" "}
            <Link to="/register" className={styles.link}>
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}