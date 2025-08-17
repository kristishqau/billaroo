import React from 'react';
import { UserIcon, RefreshCw } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile, ProfileCompletion } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  profileCompletion: ProfileCompletion | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  notification: UseNotificationReturn;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  profileCompletion,
  onImageUpload,
  uploading,
  notification
}) => {
  return (
    <header className={styles.profileHeader}>
      <div className={styles.profileAvatar}>
        {profile?.profileImageUrl ? (
          <img 
            src={`https://localhost:7263${profile.profileImageUrl}`}
            alt="Profile" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              console.error('Failed to load profile image:', profile.profileImageUrl);
              e.currentTarget.style.display = 'none';
              const parentDiv = e.currentTarget.parentElement;
              if (parentDiv) {
                const iconElement = document.createElement('div');
                iconElement.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                iconElement.style.display = 'flex';
                iconElement.style.alignItems = 'center';
                iconElement.style.justifyContent = 'center';
                iconElement.style.width = '100%';
                iconElement.style.height = '100%';
                iconElement.style.color = 'var(--text-muted)';
                parentDiv.appendChild(iconElement);
              }
            }}
          />
        ) : (
          <UserIcon />
        )}
      </div>

      <h1 className={styles.profileUsername}>
        {profile?.firstName && profile?.lastName 
          ? `${profile.firstName} ${profile.lastName}` 
          : profile?.username}
      </h1>
      <p className={styles.profileRole}>{profile?.role}</p>
      
      {/* Profile Image Upload */}
      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <input
          type="file"
          id="profileImageUpload"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={onImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => document.getElementById('profileImageUpload')?.click()}
          className={styles.exportButton}
          disabled={uploading}
          style={{ 
            fontSize: '0.875rem', 
            padding: 'var(--spacing-sm) var(--spacing-md)',
            opacity: uploading ? 0.6 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? (
            <>
              <RefreshCw size={16} className="animate-spin" style={{ marginRight: '6px' }} />
              Uploading...
            </>
          ) : (
            'Change Photo'
          )}
        </button>
        
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          marginTop: 'var(--spacing-xs)', 
          textAlign: 'center' 
        }}>
          Supported: JPEG, PNG, GIF, WebP (max 5MB)
        </p>
      </div>

      {/* Profile Completion Progress */}
      {profileCompletion && (
        <div style={{ marginTop: 'var(--spacing-lg)', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Profile Completion</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {profileCompletion.completionPercentage}%
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${profileCompletion.completionPercentage}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {profileCompletion.missingFields.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
              Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
              {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} more`}
            </p>
          )}
        </div>
      )}

      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </header>
  );
};

export default ProfileHeader;