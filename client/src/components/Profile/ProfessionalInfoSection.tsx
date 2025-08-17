import React from 'react';
import { Briefcase, Edit, LinkIcon } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface ProfessionalInfoSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    jobTitle: string;
    company: string;
    website: string;
    linkedInUrl: string;
    gitHubUrl: string;
    portfolioUrl: string;
  };
  updateField: (field: 'jobTitle' | 'company' | 'website' | 'linkedInUrl' | 'gitHubUrl' | 'portfolioUrl', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  notification: UseNotificationReturn;
}

const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({
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
        <Briefcase size={20} /> Professional Information
      </h2>
      
      {!isEditing ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Job Title</label>
              <input type="text" className={styles.formInput} value={profile?.jobTitle || 'Not set'} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Company</label>
              <input type="text" className={styles.formInput} value={profile?.company || 'Not set'} disabled />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input type="url" className={styles.formInput} value={profile?.website || 'Not set'} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>LinkedIn</label>
              <input type="url" className={styles.formInput} value={profile?.linkedInUrl || 'Not set'} disabled />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>GitHub</label>
              <input type="url" className={styles.formInput} value={profile?.gitHubUrl || 'Not set'} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Portfolio</label>
              <input type="url" className={styles.formInput} value={profile?.portfolioUrl || 'Not set'} disabled />
            </div>
          </div>

          <button onClick={() => setIsEditing(true)} className={styles.formButton}>
            <Edit size={16} /> Edit Professional Info
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label htmlFor="jobTitle" className={styles.formLabel}>Job Title</label>
              <input
                id="jobTitle"
                type="text"
                className={styles.formInput}
                value={formData.jobTitle}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="company" className={styles.formLabel}>Company</label>
              <input
                id="company"
                type="text"
                className={styles.formInput}
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label htmlFor="website" className={styles.formLabel}>Website</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="website"
                  type="url"
                  className={styles.formInput}
                  style={{ paddingLeft: '40px' }}
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="linkedInUrl" className={styles.formLabel}>LinkedIn Profile</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="linkedInUrl"
                  type="url"
                  className={styles.formInput}
                  style={{ paddingLeft: '40px' }}
                  value={formData.linkedInUrl}
                  onChange={(e) => updateField('linkedInUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div className={styles.formGroup}>
              <label htmlFor="gitHubUrl" className={styles.formLabel}>GitHub Profile</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="gitHubUrl"
                  type="url"
                  className={styles.formInput}
                  style={{ paddingLeft: '40px' }}
                  value={formData.gitHubUrl}
                  onChange={(e) => updateField('gitHubUrl', e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="portfolioUrl" className={styles.formLabel}>Portfolio</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="portfolioUrl"
                  type="url"
                  className={styles.formInput}
                  style={{ paddingLeft: '40px' }}
                  value={formData.portfolioUrl}
                  onChange={(e) => updateField('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
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

export default ProfessionalInfoSection;