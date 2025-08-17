import React from 'react';
import { EyeOff } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface PrivacySettingsSectionProps {
  showEmail: boolean;
  setShowEmail: (show: boolean) => void;
  showPhone: boolean;
  setShowPhone: (show: boolean) => void;
  showAddress: boolean;
  setShowAddress: (show: boolean) => void;
  allowMessages: boolean;
  setAllowMessages: (allow: boolean) => void;
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
        content: '""',
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

const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  showEmail,
  setShowEmail,
  showPhone,
  setShowPhone,
  showAddress,
  setShowAddress,
  allowMessages,
  setAllowMessages,
  onUpdate,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <EyeOff size={20} /> Privacy Settings
      </h2>
      
      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
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
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Show Email Address</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Allow others to see your email address
            </p>
          </div>
          <ToggleSwitch checked={showEmail} onChange={setShowEmail} />
        </div>

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
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Show Phone Number</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Allow others to see your phone number
            </p>
          </div>
          <ToggleSwitch checked={showPhone} onChange={setShowPhone} />
        </div>

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
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Show Address</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Allow others to see your address information
            </p>
          </div>
          <ToggleSwitch checked={showAddress} onChange={setShowAddress} />
        </div>

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
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Allow Messages</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Allow others to send you direct messages
            </p>
          </div>
          <ToggleSwitch checked={allowMessages} onChange={setAllowMessages} />
        </div>
      </div>

      <button onClick={onUpdate} className={styles.formButton} style={{ marginTop: 'var(--spacing-lg)' }}>
        Save Privacy Settings
      </button>
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default PrivacySettingsSection;