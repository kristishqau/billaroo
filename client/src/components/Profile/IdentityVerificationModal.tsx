import React from 'react';
import { FileText } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UseNotificationReturn } from '../../hooks/useNotification';

interface IdentityVerificationModalProps {
  show: boolean;
  onClose: () => void;
  identityFiles: {
    frontId?: File;
    backId?: File;
    selfie?: File;
  };
  updateIdentityFile: (type: 'frontId' | 'backId' | 'selfie', file?: File) => void;
  isUploading: boolean;
  onSubmit: () => void;
  notification: UseNotificationReturn;
}

const IdentityVerificationModal: React.FC<IdentityVerificationModalProps> = ({
  show,
  onClose,
  identityFiles,
  updateIdentityFile,
  isUploading,
  onSubmit
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>
          <FileText size={24} /> Identity Verification
        </h3>
        <p className={styles.modalDescription}>
          Upload your government-issued ID and a selfie for identity verification. This helps keep our platform secure.
        </p>
        
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>ID Front (Required)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateIdentityFile('frontId', e.target.files?.[0])}
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>ID Back (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateIdentityFile('backId', e.target.files?.[0])}
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Selfie (Required)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateIdentityFile('selfie', e.target.files?.[0])}
              className={styles.formInput}
            />
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancelButton}>
            Cancel
          </button>
          <button 
            onClick={onSubmit} 
            className={styles.modalConfirmButton}
            disabled={!identityFiles.frontId || !identityFiles.selfie || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Submit for Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerificationModal;