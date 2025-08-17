import React from 'react';
import { Shield, CheckCircle, XCircle, Phone, FileText, Info, LogIn, Calendar, UserIcon, Mail, AlertTriangle } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile, AccountStatus, SecuritySettings, ProfileCompletion } from '../../types';

interface AccountStatusSectionProps {
  profile: UserProfile | null;
  accountStatus: AccountStatus | null;
  securitySettings: SecuritySettings | null;
  profileCompletion: ProfileCompletion | null;
  formatDate: (date: string | null) => string;
  emailVerification: {
    isResending: boolean;
    message: string | null;
    error: string | null;
    handleResendVerification: () => void;
  };
  onEnable2FA: () => void;
  onDisable2FA: () => void;
  onIdentityVerification: () => void;
}

const AccountStatusSection: React.FC<AccountStatusSectionProps> = ({
  profile,
  accountStatus,
  securitySettings,
  profileCompletion,
  formatDate,
  emailVerification,
  onEnable2FA,
  onDisable2FA,
  onIdentityVerification
}) => {
  if (!accountStatus || !securitySettings) {
    return null;
  }

  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Shield size={20} /> Account Status & Verification
      </h2>
      
      {emailVerification.message && (
        <div className={styles.messageSuccess}>
          <CheckCircle size={18} /> {emailVerification.message}
        </div>
      )}
      {emailVerification.error && (
        <div className={styles.messageError}>
          <XCircle size={18} /> {emailVerification.error}
        </div>
      )}

      {/* Verification Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        {/* Email Verification */}
        <div className={`${styles.securityCard} ${securitySettings.isEmailVerified ? styles.verified : styles.unverified}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div className={`${styles.statusIcon} ${securitySettings.isEmailVerified ? styles.success : styles.danger}`}>
              {securitySettings.isEmailVerified ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Email Verification</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {securitySettings.isEmailVerified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>
          </div>
          {!securitySettings.isEmailVerified && (
            <button 
              onClick={emailVerification.handleResendVerification} 
              className={styles.miniButton}
              disabled={emailVerification.isResending}
            >
              <Mail size={14} />
              {emailVerification.isResending ? 'Sending...' : 'Verify'}
            </button>
          )}
        </div>

        {/* Phone Verification */}
        <div className={`${styles.securityCard} ${securitySettings.isPhoneVerified ? styles.verified : styles.warning}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div className={`${styles.statusIcon} ${securitySettings.isPhoneVerified ? styles.success : styles.warning}`}>
              {securitySettings.isPhoneVerified ? (
                <CheckCircle size={20} />
              ) : (
                <Phone size={20} />
              )}
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Phone Verification</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {securitySettings.isPhoneVerified ? 'Phone verified' : 'Phone not verified'}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className={`${styles.securityCard} ${securitySettings.twoFactorEnabled ? styles.verified : styles.info}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div className={`${styles.statusIcon} ${securitySettings.twoFactorEnabled ? styles.success : styles.info}`}>
              <Shield size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Two-Factor Auth</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {securitySettings.twoFactorEnabled ? '2FA enabled' : '2FA disabled'}
              </p>
            </div>
          </div>
          <button 
            className={styles.formButton}
            onClick={securitySettings.twoFactorEnabled ? onDisable2FA : onEnable2FA}
          >
            {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Identity Verification */}
        <div className={`${styles.securityCard} ${securitySettings.isIdentityVerified ? styles.verified : styles.warning}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div className={`${styles.statusIcon} ${securitySettings.isIdentityVerified ? styles.success : styles.warning}`}>
              {securitySettings.isIdentityVerified ? (
                <CheckCircle size={20} />
              ) : (
                <FileText size={20} />
              )}
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Identity Verification</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {securitySettings.isIdentityVerified ? 'Identity verified' : 'Identity not verified'}
              </p>
            </div>
          </div>
          {!securitySettings.isIdentityVerified && (
            <button 
              className={styles.formButton}
              onClick={onIdentityVerification}
            >
              <FileText size={14} />
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Account Information Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
        {/* Account Status */}
        <div className={styles.infoCard}>
          <Info size={20} className={styles.infoIcon} style={{ 
            color: accountStatus.isAccountLocked ? 'var(--danger)' : 'var(--success)' 
          }} />
          <div style={{ flex: 1 }}>
            <p className={styles.infoText}>
              <span style={{ fontWeight: '600' }}>Account Status:</span>{' '}
              <span style={{ 
                color: accountStatus.isAccountLocked ? 'var(--danger)' : 'var(--success)',
                fontWeight: '600'
              }}>
                {accountStatus.isAccountLocked ? 'Locked' : 'Active'}
              </span>
            </p>
            {accountStatus.isAccountLocked && accountStatus.lockoutEnd && (
              <p style={{ fontSize: '0.875rem', color: 'var(--danger)', margin: '4px 0 0 0' }}>
                Locked until {formatDate(accountStatus.lockoutEnd)}
              </p>
            )}
            {accountStatus.failedLoginAttempts > 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--warning)', margin: '4px 0 0 0' }}>
                Failed login attempts: {accountStatus.failedLoginAttempts}/5
              </p>
            )}
          </div>
        </div>

        {/* Last Login */}
        <div className={styles.infoCard}>
          <LogIn size={20} className={styles.infoIcon} />
          <div style={{ flex: 1 }}>
            <p className={styles.infoText}>
              <span style={{ fontWeight: '600' }}>Last Login:</span>{' '}
              {formatDate(accountStatus.lastLoginAt)}
            </p>
            {accountStatus.lastLoginAt && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {new Date(accountStatus.lastLoginAt).toLocaleDateString() === new Date().toLocaleDateString() 
                  ? 'Today' 
                  : `${Math.floor((new Date().getTime() - new Date(accountStatus.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`}
              </p>
            )}
          </div>
        </div>

        {/* Account Created */}
        <div className={styles.infoCard}>
          <Calendar size={20} className={styles.infoIcon} />
          <div style={{ flex: 1 }}>
            <p className={styles.infoText}>
              <span style={{ fontWeight: '600' }}>Member Since:</span>{' '}
              {formatDate(accountStatus.createdAt)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {Math.floor((new Date().getTime() - new Date(accountStatus.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
        </div>

        {/* Profile Completeness */}
        {profileCompletion && (
          <div className={styles.infoCard}>
            <UserIcon size={20} className={styles.infoIcon} />
            <div style={{ flex: 1 }}>
              <p className={styles.infoText}>
                <span style={{ fontWeight: '600' }}>Profile Completion:</span>{' '}
                <span style={{ 
                  color: profileCompletion.completionPercentage >= 80 ? 'var(--success)' : 
                        profileCompletion.completionPercentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                  fontWeight: '600'
                }}>
                  {profileCompletion.completionPercentage}%
                </span>
              </p>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '3px', 
                marginTop: 'var(--spacing-xs)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${profileCompletion.completionPercentage}%`,
                  height: '100%',
                  background: profileCompletion.completionPercentage >= 80 ? 'var(--success)' : 
                            profileCompletion.completionPercentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      {(!profile?.isEmailVerified || !profile?.twoFactorEnabled || !profile?.isPhoneVerified) && (
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)', marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--warning)', fontSize: '1rem' }}>
                  Security Recommendations
                </h4>
                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                  {!profile?.isEmailVerified && (
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Verify your email address</li>
                  )}
                  {!profile?.isPhoneVerified && (
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Add and verify your phone number</li>
                  )}
                  {!profile?.twoFactorEnabled && (
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Enable two-factor authentication</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountStatusSection;