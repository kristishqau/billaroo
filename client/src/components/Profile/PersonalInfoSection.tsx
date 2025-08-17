import React from 'react';
import { UserIcon, Edit } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface PersonalInfoSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    bio: string;
  };
  updateField: (field: 'firstName' | 'lastName' | 'bio', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  notification: UseNotificationReturn;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  profile,
  isEditing,
  setIsEditing,
  formData,
  updateField,
  onSubmit,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <UserIcon size={20} /> Personal Information
      </h2>
      
      {!isEditing ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name</label>
              <input type="text" className={styles.formInput} value={profile?.firstName || 'Not set'} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name</label>
              <input type="text" className={styles.formInput} value={profile?.lastName || 'Not set'} disabled />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Bio</label>
            <textarea 
              className={styles.formInput} 
              value={profile?.bio || 'Not set'} 
              disabled 
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <button onClick={() => setIsEditing(true)} className={styles.formButton}>
            <Edit size={16} /> Edit Personal Info
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.formLabel}>First Name</label>
              <input
                id="firstName"
                type="text"
                className={styles.formInput}
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Your first name"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.formLabel}>Last Name</label>
              <input
                id="lastName"
                type="text"
                className={styles.formInput}
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Your last name"
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="bio" className={styles.formLabel}>Bio</label>
            <textarea
              id="bio"
              className={styles.formInput}
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button type="submit" className={styles.formButton}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={styles.exportButton}
            >
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

export default PersonalInfoSection;