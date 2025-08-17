import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import styles from './Notification.module.css';
import type { NotificationState } from '../../hooks/useNotification';

interface NotificationProps {
  notification: NotificationState | null;
  onClose: () => void;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose, className }) => {
  if (!notification) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div 
      className={`
        ${styles.notification} 
        ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationError} 
        ${className || ''}
      `}
    >
      <div className={styles.notificationContent}>
        <div className={styles.notificationIcon}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
        </div>
        <div className={styles.notificationMessage}>
          {notification.message}
        </div>
      </div>
      <button 
        onClick={handleClose}
        className={styles.closeButton}
        aria-label="Close notification"
      >
        <X />
      </button>
    </div>
  );
};

export default Notification;