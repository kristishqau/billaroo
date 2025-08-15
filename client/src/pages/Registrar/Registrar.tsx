import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import styles from "./Register.module.css"
import { useAuth } from "../../context/AuthContext"
import axios from "../../api/axios"
import { useAvailabilityCheck } from "../../hooks/useAvailabilityCheck"
import { usePasswordValidation } from "../../hooks/usePasswordValidation"
import { Eye, EyeOff } from "lucide-react"

type RegisterForm = {
  username: string
  email: string
  password: string
  confirmPassword: string
  role: "freelancer" | "client"
  agreeToTerms: boolean
  phoneNumber?: string
}

type RegisterResponse = {
  id: number
  username: string
  email: string
  role: string
  token: string
  isEmailVerified: boolean
}

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
    agreeToTerms: false,
    phoneNumber: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [phoneNumber, setPhoneNumber] = useState("")

  // Use the custom availability check hook
  const { availability, loading: checkingAvailability } = useAvailabilityCheck(form.username, form.email)
  
  // Use the password validation hook
  const { validation: passwordValidation, loading: validatingPassword } = usePasswordValidation(form.password)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Real-time validation
  useEffect(() => {
    const errors: {[key: string]: string} = {}
    
    if (form.username && form.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
    } else if (availability?.isUsernameAvailable === false) {
      errors.username = availability.usernameMessage || "Username is not available"
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address"
    } else if (availability?.isEmailAvailable === false) {
      errors.email = availability.emailMessage || "Email is not available"
    }
    
    // Use password validation hook result instead of basic length check
    if (form.password && passwordValidation && !passwordValidation.isValid) {
      errors.password = "Password does not meet requirements"
    }
    
    if (form.confirmPassword && form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (phoneNumber && !/^\+355\d{8,9}$|^0\d{8,9}$/.test(phoneNumber)) {
      errors.phoneNumber = "Please enter a valid Albanian phone number (e.g. +355671234567)";
    }
    
    setValidationErrors(errors)
  }, [form, phoneNumber, availability, passwordValidation]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear global error when user starts typing
    if (error) {
      setError("")
    }
    
    // Clear success message when editing form
    if (success) {
      setSuccess("")
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Client-side validation
    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the validation errors above")
      setLoading(false)
      return
    }

    if (!form.agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      setLoading(false)
      return
    }

    try {
      const registerData = {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        phoneNumber: phoneNumber || undefined
      }

      const response = await axios.post<RegisterResponse>("/Auth/register", registerData)
      const user = response.data
      
      setSuccess(
        user.isEmailVerified 
          ? "Account created successfully! Redirecting..." 
          : "Account created! Please check your email to verify your account. Redirecting..."
      )
      
      // Auto-login the user
      login(user)
      
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        if (user.role === 'freelancer') {
          navigate("/home")
        } else {
          navigate("/home") // Could be different for clients
        }
      }, user.isEmailVerified ? 1500 : 3000)

    } catch (err: any) {
      console.error('Registration error:', err)
      
      // Better error handling
      let errorMessage = "Registration failed. Please try again."
      
      if (err.response?.status === 400) {
        const responseData = err.response.data
        if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (responseData?.message) {
          errorMessage = responseData.message
        } else {
          // Handle specific validation errors from server
          if (responseData?.errors) {
            const serverErrors = Object.values(responseData.errors).flat()
            errorMessage = serverErrors.join(', ')
          }
        }
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle password visibility
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.registerCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Billaroo</h1>
            <div className={styles.tagline}>Freelancer Management Platform</div>
          </div>
          <h2>Create Your Account</h2>
          <p>Join our community of freelancers managing their business</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="username">
                Username <span className={styles.required}>*</span>
              </label>
              <div className={styles.fieldIcon}>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  autoComplete="username"
                  disabled={loading}
                  className={validationErrors.username ? styles.inputError : ''}
                />
              </div>
              {validationErrors.username && (
                <span className={styles.fieldError}>{validationErrors.username}</span>
              )}
              {!validationErrors.username && 
              form.username.length >= 3 && 
              availability?.usernameMessage && 
              availability?.isUsernameAvailable && (
                <span className={styles.fieldSuccess}>{availability.usernameMessage}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="role">
                Account Type <span className={styles.required}>*</span>
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                disabled={loading}
                className={styles.select}
              >
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">
              Email Address <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldIcon}>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                disabled={loading}
                className={validationErrors.email ? styles.inputError : ''}
              />
            </div>
            {validationErrors.email && (
              <span className={styles.fieldError}>{validationErrors.email}</span>
            )}
            {!validationErrors.email && 
            form.email.includes('@') && 
            form.email.length > 3 &&
            availability?.emailMessage && 
            availability?.isEmailAvailable && (
              <span className={styles.fieldSuccess}>{availability.emailMessage}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className={styles.phoneWrapper}>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={loading}
                className={validationErrors.phoneNumber ? styles.inputError : ''}
              />
            </div>
            {validationErrors.phoneNumber && (
              <span className={styles.fieldError}>{validationErrors.phoneNumber}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                disabled={loading}
                className={validationErrors.password ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('password')}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {passwordValidation && form.password && (
              <div className={styles.passwordFeedback}>
                <div className={`${styles.strengthBar} ${styles[`strength${passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}`]}`}>
                  <div className={styles.strengthFill}></div>
                </div>
                <span className={styles.strengthText}>
                  Password strength: {passwordValidation.strength}
                  {validatingPassword && <span className={styles.validatingText}> (validating...)</span>}
                </span>
                
                {passwordValidation.violations.length > 0 && (
                  <ul className={styles.violationsList}>
                    {passwordValidation.violations.map((violation, index) => (
                      <li key={index} className={styles.violation}>
                        {violation}
                      </li>
                    ))}
                  </ul>
                )}
                
                {passwordValidation.requirements.length > 0 && passwordValidation.isValid && (
                  <div className={styles.requirementsMet}>
                    ✅ All password requirements met
                  </div>
                )}
              </div>
            )}
            
            {validationErrors.password && (
              <span className={styles.fieldError}>{validationErrors.password}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">
              Confirm Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={loading}
                className={validationErrors.confirmPassword ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className={styles.fieldError}>{validationErrors.confirmPassword}</span>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && form.password.length > 0 && (
              <span className={styles.fieldSuccess}> Passwords match</span>
            )}
          </div>

          <div className={styles.termsSection}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={form.agreeToTerms}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="agreeToTerms">
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success} role="alert">
              <span className={styles.successIcon}>✅</span>
              {success}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={
              loading || 
              Object.keys(validationErrors).length > 0 || 
              !form.agreeToTerms ||
              checkingAvailability || 
              validatingPassword ||
              availability?.isUsernameAvailable === false || 
              availability?.isEmailAvailable === false ||
              !!(passwordValidation && !passwordValidation.isValid)
            }
          >
            {loading && <span className={styles.spinner}></span>}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}