import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import axios from "../../../api/axios";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { validation } = usePasswordValidation(password);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (validation && !validation.isValid) {
      setError("Please ensure your password meets all requirements");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("/Auth/reset-password", {
        token,
        newPassword: password
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      let errorMessage = "An error occurred while resetting your password";
      
      if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' 
          ? err.response.data 
          : err.response.data.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <h1>Billaroo</h1>
              <div className={styles.tagline}>Freelancer Management Platform</div>
            </div>
            <div className={styles.successIcon}>✅</div>
            <h2>Password Reset Successfully</h2>
            <p>Your password has been reset. You will be redirected to login in a few seconds.</p>
          </div>
          
          <div className={styles.actions}>
            <Link to="/login" className={styles.loginButton}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <h1>Billaroo</h1>
              <div className={styles.tagline}>Freelancer Management Platform</div>
            </div>
            <h2>Invalid Reset Link</h2>
            <p>The password reset link is invalid or has expired.</p>
          </div>
          
          <div className={styles.actions}>
            <Link to="/forgot-password" className={styles.backButton}>
              Request New Reset Link
            </Link>
            <Link to="/login" className={styles.loginButton}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Billaroo</h1>
            <div className={styles.tagline}>Freelancer Management Platform</div>
          </div>
          <h2>Reset Your Password</h2>
          <p>Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="password">New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {validation && password && (
              <div className={styles.passwordFeedback}>
                <div className={`${styles.strengthBar} ${styles[`strength${validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}`]}`}>
                  <div className={styles.strengthFill}></div>
                </div>
                <span className={styles.strengthText}>
                  Password strength: {validation.strength}
                </span>
                
                {validation.violations.length > 0 && (
                  <ul className={styles.violationsList}>
                    {validation.violations.map((violation, index) => (
                      <li key={index} className={styles.violation}>
                        {violation}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span className={styles.mismatchError}>Passwords do not match</span>
            )}
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || !password || !confirmPassword || password !== confirmPassword || !!(validation && !validation.isValid)}
          >
            {loading && <span className={styles.spinner}></span>}
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Remember your password?{" "}
            <Link to="/login" className={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}