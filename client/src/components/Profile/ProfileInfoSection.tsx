import React from 'react';
import { UserIcon, Edit } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface ProfileInfoSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    username: string;
    email: string;
  };
  updateField: (field: 'username' | 'email', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  notification: UseNotificationReturn;
}

const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
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
        <UserIcon size={20} /> Profile Information
      </h2>
      
      {!isEditing ? (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Username</label>
            <input type="text" className={styles.formInput} value={profile?.username || ''} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input type="email" className={styles.formInput} value={profile?.email || ''} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Role</label>
            <input type="text" className={styles.formInput} value={profile?.role || ''} disabled />
          </div>
          <button onClick={() => setIsEditing(true)} className={styles.formButton}>
            <Edit size={16} /> Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>Username</label>
            <input
              id="username"
              type="text"
              className={styles.formInput}
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email</label>
            <input
              id="email"
              type="email"
              className={styles.formInput}
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Role</label>
            <input type="text" className={styles.formInput} value={profile?.role || ''} disabled />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button type="submit" className={styles.formButton}>
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={`${styles.formButton} ${styles.exportButton}`}>
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

export default ProfileInfoSection;