import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.pageTitle}>Page Not Found</h2>
          <p className={styles.description}>
            Sorry, the page you're looking for doesn't exist or has been moved. 
            Let's get you back to where you need to be.
          </p>
        </div>
        
        <div className={styles.buttonGroup}>
          <Link 
            to="/"
            className={styles.primaryButton}
          >
            Go to Home
          </Link>
          <Link 
            to="/login" 
            className={styles.secondaryButton}
          >
            Back to Login
          </Link>
        </div>
        
        <div className={styles.footerText}>
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  )
}