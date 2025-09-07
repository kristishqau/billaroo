import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEmailVerification } from '../../../hooks/useSecurity';
import styles from './VerifyEmail.module.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const { handleVerifyEmail, isVerifying } = useEmailVerification();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      setStatus('loading');
      const result = await handleVerifyEmail(token);
      if (result.success) {
        setStatus('success');
        setMessage('Email verified successfully! You can now use all features of your account.');
        
        // Redirect to profile or dashboard after 3 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Email verification failed. The link may be invalid or expired.');
      }
    } catch {
      setStatus('error');
      setMessage('An unexpected error occurred during verification.');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${status === 'success' ? styles.successCard : status === 'error' ? styles.errorCard : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <h1>Billaroo</h1>
            <div className={styles.tagline}>Freelancer Management Platform</div>
          </div>

          {(status === 'loading' || isVerifying) && (
            <>
              <div className={styles.loadingSpinner}></div>
              <h2 className={`${styles.title} ${styles.loadingTitle}`}>Verifying Email...</h2>
              <p className={styles.message}>Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={styles.statusIcon}>
                <CheckCircle size={64} color="#10b981" />
              </div>
              <h2 className={`${styles.title} ${styles.successTitle}`}>Email Verified!</h2>
              <p className={styles.message}>{message}</p>
              <p className={styles.redirectMessage}>You will be redirected to your profile in a few seconds...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={styles.statusIcon}>
                <XCircle size={64} color="#ef4444" />
              </div>
              <h2 className={`${styles.title} ${styles.errorTitle}`}>Verification Failed</h2>
              <p className={styles.message}>{message}</p>
            </>
          )}
        </div>

        {status !== 'loading' && !isVerifying && (
          <div className={styles.actions}>
            {status === 'success' ? (
              <>
                <button onClick={handleGoToProfile} className={styles.primaryButton}>
                  Go to Profile
                </button>
                <button onClick={handleGoHome} className={styles.secondaryButton}>
                  Go to Home
                </button>
              </>
            ) : (
              <>
                <button onClick={handleGoToLogin} className={styles.primaryButton}>
                  Go to Login
                </button>
                <button onClick={handleGoHome} className={styles.secondaryButton}>
                  Go to Home
                </button>
              </>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <p>
            Need help?{" "}
            <Link to="/support" className={styles.link}>
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}