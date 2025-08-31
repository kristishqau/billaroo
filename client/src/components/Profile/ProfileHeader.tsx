import React, { useState, useEffect } from 'react';
import { UserIcon, RefreshCw, Calendar, MapPin, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
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
  isClient?: boolean;
  privacySettings?: {
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
  };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  profileCompletion,
  onImageUpload,
  uploading,
  notification,
  isClient = false,
  privacySettings = { showEmail: true, showPhone: true, showAddress: true }
}) => {
  // Hook to track window width for responsiveness
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    if (windowWidth <= 768) return '1fr';
    if (windowWidth <= 1024) return 'auto 1fr';
    return 'auto 1fr auto';
  };

  // Mobile completion component
  const MobileCompletionSection = () => {
    if (!profileCompletion || windowWidth > 1024) return null;

    return (
      <div style={{ 
        gridColumn: '1 / -1',
        maxWidth: '400px',
        margin: 'var(--spacing-lg) auto 0 auto',
        width: '100%'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 var(--spacing-sm) 0', 
            color: 'var(--text-primary)', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Profile Completion
          </h3>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            background: profileCompletion.completionPercentage >= 80 
              ? 'var(--gradient-primary)' 
              : profileCompletion.completionPercentage >= 50 
              ? 'linear-gradient(135deg, var(--warning) 0%, #f6ad55 100%)'
              : 'linear-gradient(135deg, var(--danger) 0%, #f56565 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            {profileCompletion.completionPercentage}%
          </div>
          
          {/* Smaller circular progress for mobile */}
          <div style={{ 
            position: 'relative', 
            width: '80px', 
            height: '80px', 
            margin: 'var(--spacing-sm) auto' 
          }}>
            <svg 
              width="80" 
              height="80" 
              style={{ 
                transform: 'rotate(-90deg)',
                maxWidth: '100%',
                height: 'auto'
              }}
              viewBox="0 0 80 80"
            >
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="url(#progressGradientMobile)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(profileCompletion.completionPercentage / 100) * 201} 201`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              <defs>
                <linearGradient id="progressGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Condensed missing fields for mobile */}
          {profileCompletion.missingFields.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {profileCompletion.missingFields.length} field{profileCompletion.missingFields.length > 1 ? 's' : ''} remaining
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <header className={styles.profileHeader}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: getGridColumns(),
        gap: windowWidth <= 768 ? 'var(--spacing-xs)' : 'var(--spacing-xl)', 
        alignItems: windowWidth <= 768 ? 'center' : 'center'
      }} className="profile-header-grid">
        
        {/* Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
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
                    iconElement.innerHTML = '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                    iconElement.style.display = 'flex';
                    iconElement.style.alignItems = 'center';
                    iconElement.style.justifyContent = 'center';
                    iconElement.style.width = '100%';
                    iconElement.style.height = '100%';
                    iconElement.style.color = 'var(--text-primary)';
                    parentDiv.appendChild(iconElement);
                  }
                }}
              />
            ) : (
              <UserIcon />
            )}
          </div>

          {/* Profile Image Upload */}
          <div>
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
                  <RefreshCw size={16} className="animate-spin" />
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
              marginBottom: windowWidth <= 768 ? 'var(--spacing-md)' : '',
              textAlign: 'center' 
            }}>
              JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>
        </div>

        {/* Main Info Section */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h1 className={styles.profileUsername}>
              {profile?.firstName && profile?.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : profile?.username}
            </h1>
            <div style={{ gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <p className={styles.profileRole}>{profile?.role}</p>
              {profile?.company && !isClient && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  @ {profile.company}
                </span>
              )}
            </div>
          </div>

          {/* Quick Info Grid - Apply privacy settings */}
          <div className="profile-info-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-lg)'
          }}>
            {/* Email - Show only if privacy settings allow */}
            {profile?.email && privacySettings.showEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {profile.email}
                </span>
                {profile.isEmailVerified ? (
                  <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <XCircle size={14} style={{ color: 'var(--danger)' }} />
                )}
              </div>
            )}
            
            {/* Phone - Show only if privacy settings allow */}
            {profile?.phoneNumber && privacySettings.showPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {profile.phoneNumber}
                </span>
                {profile.isPhoneVerified ? (
                  <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <XCircle size={14} style={{ color: 'var(--danger)' }} />
                )}
              </div>
            )}
            
            {/* Address - Show only if privacy settings allow */}
            {(profile?.city || profile?.country) && privacySettings.showAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {[profile?.city, profile?.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            {/* Member Since - Always show */}
            {profile?.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Bio Section */}
          {profile?.bio && (
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.5)', 
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--spacing-md)', 
              marginBottom: 'var(--spacing-lg)' 
            }}>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}>
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {/* Profile Completion Section - Only show for freelancers on desktop */}
        {windowWidth > 1024 && !isClient && (
          <div className="profile-completion-container" style={{ minWidth: '250px' }}>
            {profileCompletion && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <h3 style={{ 
                    margin: '0 0 var(--spacing-sm) 0', 
                    color: 'var(--text-primary)', 
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    Profile Completion
                  </h3>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    background: profileCompletion.completionPercentage >= 80 
                      ? 'var(--gradient-primary)' 
                      : profileCompletion.completionPercentage >= 50 
                      ? 'linear-gradient(135deg, var(--warning) 0%, #f6ad55 100%)'
                      : 'linear-gradient(135deg, var(--danger) 0%, #f56565 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    {profileCompletion.completionPercentage}%
                  </div>
                </div>

                {/* Circular Progress */}
                <div style={{ 
                  position: 'relative', 
                  width: '120px', 
                  height: '120px', 
                  margin: '0 auto var(--spacing-md) auto' 
                }}>
                  <svg 
                    width="120" 
                    height="120" 
                    style={{ 
                      transform: 'rotate(-90deg)',
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(profileCompletion.completionPercentage / 100) * 314} 314`}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="var(--secondary)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Missing Fields */}
                {profileCompletion.missingFields.length > 0 && (
                  <div>
                    <h4 style={{ 
                      margin: '0 0 var(--spacing-sm) 0', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      Complete your profile:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                      {profileCompletion.missingFields.slice(0, 4).map((field) => (
                        <span
                          key={field}
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: 'var(--warning)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                      {profileCompletion.missingFields.length > 4 && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)' 
                        }}>
                          +{profileCompletion.missingFields.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile/Tablet Completion Section - Only show for freelancers */}
        {!isClient && <MobileCompletionSection />}
      </div>

      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </header>
  );
};

export default ProfileHeader;