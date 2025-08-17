import React from 'react';
import { Info } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface NotificationPreferencesSectionProps {
  emailNotifications: boolean;
  setEmailNotifications: (enabled: boolean) => void;
  smsNotifications: boolean;
  setSmsNotifications: (enabled: boolean) => void;
  marketingEmails: boolean;
  setMarketingEmails: (enabled: boolean) => void;
  onUpdate: () => void;
  notification: UseNotificationReturn;
}

const ToggleSwitch: React.FC<{ 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
}> = ({ checked, onChange }) => (
  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ opacity: 0, width: 0, height: 0 }}
    />
    <span style={{
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: checked ? 'var(--primary)' : 'var(--bg-tertiary)',
      transition: '0.4s',
      borderRadius: '24px'
    }}>
      <span style={{
        position: 'absolute',
        height: '18px',
        width: '18px',
        left: checked ? '28px' : '3px',
        bottom: '3px',
        backgroundColor: 'white',
        transition: '0.4s',
        borderRadius: '50%'
      }} />
    </span>
  </label>
);

const NotificationPreferencesSection: React.FC<NotificationPreferencesSectionProps> = ({
  emailNotifications,
  setEmailNotifications,
  smsNotifications,
  setSmsNotifications,
  marketingEmails,
  setMarketingEmails,
  onUpdate,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Info size={20} /> Notification Preferences
      </h2>

      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        {/* Email Notifications */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 'var(--spacing-md)', 
          background: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border)' 
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Email Notifications</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Receive important updates via email
            </p>
          </div>
          <ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} />
        </div>

        {/* SMS Notifications */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 'var(--spacing-md)', 
          background: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border)' 
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>SMS Notifications</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Receive urgent notifications via SMS
            </p>
          </div>
          <ToggleSwitch checked={smsNotifications} onChange={setSmsNotifications} />
        </div>

        {/* Marketing Emails */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 'var(--spacing-md)', 
          background: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border)' 
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Marketing Emails</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Receive product updates and promotional content
            </p>
          </div>
          <ToggleSwitch checked={marketingEmails} onChange={setMarketingEmails} />
        </div>
      </div>

      <button
        onClick={onUpdate}
        className={styles.formButton}
        style={{ marginTop: 'var(--spacing-lg)' }}
      >
        Save Notification Preferences
      </button>

      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default NotificationPreferencesSection;