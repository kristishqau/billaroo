import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ForgotPassword.module.css";
import axios from "../../../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post("/Auth/forgot-password", { email });
      setMessage("If an account with that email exists, a password reset link has been sent.");
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      let errorMessage = "An error occurred. Please try again.";
      
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

  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <h1>Billaroo</h1>
              <div className={styles.tagline}>Freelancer Management Platform</div>
            </div>
            {!isSubmitted ? (
              <>
                <h2>Forgot Password?</h2>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
              </>
            ) : (
              <>
                <h2>Check Your Email</h2>
                <p>{message}</p>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <Link to="/login" className={styles.backButton}>
              Back to Login
            </Link>
            <button
              type="button"
              className={styles.resendButton}
              onClick={() => {
                setIsSubmitted(false);
                setMessage("");
              }}
            >
              Send Another Email
            </button>
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
          </div>
          <h2>Forgot Password?</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.fieldIcon}>
              <span className={styles.icon}>📧</span>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>
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
            disabled={loading || !email}
          >
            {loading && <span className={styles.spinner}></span>}
            {loading ? "Sending..." : "Send Reset Link"}
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