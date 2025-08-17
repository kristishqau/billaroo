import React from 'react';
import { Key, EyeOff, Eye } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface PasswordChangeSectionProps {
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (password: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmNewPassword: boolean;
  setShowConfirmNewPassword: (show: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  notification: UseNotificationReturn;
}

const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword,
  onSubmit,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Key size={20} /> Change Password
      </h2>
      <form onSubmit={onSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.formLabel}>Current Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              className={styles.formInput}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.formLabel}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className={styles.formInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && (
              <div style={{ marginTop: 'var(--spacing-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.75rem' }}>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min((newPassword.length / 8) * 100, 100)}%`,
                      height: '100%',
                      backgroundColor: newPassword.length < 6 ? 'var(--danger)' : newPassword.length < 8 ? 'var(--warning)' : 'var(--success)',
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <span style={{ color: newPassword.length < 6 ? 'var(--danger)' : newPassword.length < 8 ? 'var(--warning)' : 'var(--success)', whiteSpace: 'nowrap' }}>
                    {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmNewPassword" className={styles.formLabel}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                className={styles.formInput}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                style={{
                  borderColor: confirmNewPassword && newPassword !== confirmNewPassword ? 'var(--danger)' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmNewPassword && newPassword !== confirmNewPassword && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 'var(--spacing-xs)' }}>
                Passwords do not match
              </p>
            )}
          </div>
        </div>
        
        <button 
          type="submit" 
          className={styles.formButton}
          disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
        >
          Change Password
        </button>
      </form>
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default PasswordChangeSection;