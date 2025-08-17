import React from 'react';
import { Mail, Edit, CheckCircle, XCircle } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface PhoneVerificationState {
  code: string;
  setCode: (code: string) => void;
  isSent: boolean;
  error: string | null;
  success: string | null;
  handleSendVerification: (phoneNumber: string) => void;
  handleVerifyPhone: () => void;
}

interface ContactInfoSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    phoneNumber: string;
    city: string;
    country: string;
  };
  updateField: (field: 'phoneNumber' | 'city' | 'country', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  phoneVerification: PhoneVerificationState;
  notification: UseNotificationReturn;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  profile,
  isEditing,
  setIsEditing,
  formData,
  updateField,
  onSubmit,
  phoneVerification,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Mail size={20} /> Contact Information
      </h2>
      
      {phoneVerification.success && (
        <div className={styles.messageSuccess}>
          <CheckCircle size={18} /> {phoneVerification.success}
        </div>
      )}
      {phoneVerification.error && (
        <div className={styles.messageError}>
          <XCircle size={18} /> {phoneVerification.error}
        </div>
      )}
      
      {!isEditing ? (
        <div>
          <div style={{ display: 'grid', gap: 'var(--spacing-sm)', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input type="text" className={styles.formInput} value={profile?.phoneNumber || 'Not set'} disabled />
                {profile?.isPhoneVerified ? (
                  <CheckCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }} />
                ) : (
                  <XCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)' }} />
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>City</label>
              <input type="text" className={styles.formInput} value={profile?.city || 'Not set'} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Country</label>
              <input type="text" className={styles.formInput} value={profile?.country || 'Not set'} disabled />
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} className={styles.formButton}>
            <Edit size={16} /> Edit Contact Info
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.formLabel}>Phone Number</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <input
                  id="phoneNumber"
                  type="tel"
                  className={styles.formInput}
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  placeholder="+1234567890"
                />
                {!profile?.isPhoneVerified && formData.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => phoneVerification.handleSendVerification(formData.phoneNumber)}
                    className={styles.exportButton}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Verify
                  </button>
                )}
              </div>
              {phoneVerification.isSent && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={phoneVerification.code}
                    onChange={(e) => phoneVerification.setCode(e.target.value)}
                    placeholder="Enter verification code"
                    style={{ marginBottom: 'var(--spacing-sm)' }}
                  />
                  <button
                    type="button"
                    onClick={phoneVerification.handleVerifyPhone}
                    className={styles.formButton}
                    style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                  >
                    Confirm Code
                  </button>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="city" className={styles.formLabel}>City</label>
              <input
                id="city"
                type="text"
                className={styles.formInput}
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Your city"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="country" className={styles.formLabel}>Country</label>
              <input
                id="country"
                type="text"
                className={styles.formInput}
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                placeholder="Your country"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button type="submit" className={styles.formButton}>
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.exportButton}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default ContactInfoSection;