import React from 'react';
import { Download, RefreshCw, FileText } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserProfile } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface CVSectionProps {
  profile: UserProfile | null;
  formatDate: (date: string | null) => string;
  onCvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  notification: UseNotificationReturn;
}
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const CVSection: React.FC<CVSectionProps> = ({
  profile,
  formatDate,
  onCvUpload,
  uploading,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Download size={20} /> CV / Resume
      </h2>
      
      <div className={styles.infoCard}>
        <div style={{ flex: 1 }}>
          <p className={styles.infoText}>
            {profile?.cvUrl ? (
              <>
                CV uploaded on <span>{profile.cvUploadedAt ? formatDate(profile.cvUploadedAt) : 'Unknown date'}</span>
              </>
            ) : (
              'No CV uploaded yet. Upload your CV to showcase your experience.'
            )}
          </p>
          {profile?.cvUrl && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <a 
                href={`${apiUrl}${profile.cvUrl}`}
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.exportButton}
                style={{ 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)',
                  fontSize: '0.875rem',
                  padding: 'var(--spacing-sm) var(--spacing-md)'
                }}
              >
                View Resume
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <input
          type="file"
          id="cvUpload"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onCvUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => document.getElementById('cvUpload')?.click()}
          className={styles.formButton}
          disabled={uploading}
          style={{ 
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
            <>
              <FileText size={16} style={{ marginRight: '6px' }} />
              {profile?.cvUrl ? 'Update CV' : 'Upload CV'}
            </>
          )}
        </button>
        
        {/* Add file type hint */}
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          marginTop: 'var(--spacing-xs)' 
        }}>
          Supported formats: PDF, DOC, DOCX (max 10MB)
        </p>
      </div>
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default CVSection;