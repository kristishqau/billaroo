import React from 'react';
import { Trash2, Download } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface AccountManagementSectionProps {
  onExportData: () => void;
  onDeleteAccount: () => void;
  notification: UseNotificationReturn;
}

const AccountManagementSection: React.FC<AccountManagementSectionProps> = ({
  onExportData,
  onDeleteAccount,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Trash2 size={20} /> Account Management
      </h2>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <button onClick={onExportData} className={styles.exportButton}>
          <Download size={16} /> Export My Data
        </button>
        <button onClick={onDeleteAccount} className={styles.deleteButton}>
          <Trash2 size={16} /> Delete My Account
        </button>
      </div>
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default AccountManagementSection;