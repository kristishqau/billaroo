import React from 'react';
import { Shield, RefreshCw, XCircle } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';

interface TwoFactorAuthModalProps {
  show: boolean;
  onClose: () => void;
  isEnabling: boolean;
  qrCode: string | null;
  code: string;
  setCode: (code: string) => void;
  error: string | null;
  onConfirm: () => void;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  show,
  onClose,
  isEnabling,
  qrCode,
  code,
  setCode,
  error,
  onConfirm
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>
          <Shield size={24} /> Enable Two-Factor Authentication
        </h3>
        
        {isEnabling ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <RefreshCw size={24} className="animate-spin" />
            <p>Setting up 2FA...</p>
          </div>
        ) : (
          <>
            <p className={styles.modalDescription}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the verification code below.
            </p>
            
            {qrCode && (
              <div style={{ textAlign: 'center', margin: 'var(--spacing-lg) 0' }}>
                <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="twoFactorCode" className={styles.formLabel}>Verification Code</label>
              <input
                id="twoFactorCode"
                type="text"
                className={styles.formInput}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            
            {error && (
              <div className={styles.messageError}>
                <XCircle size={18} /> {error}
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button onClick={onClose} className={styles.modalCancelButton}>
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                className={styles.modalConfirmButton}
                disabled={code.length !== 6}
              >
                Enable 2FA
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuthModal;