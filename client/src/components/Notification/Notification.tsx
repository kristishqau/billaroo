import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  if (!message) return null;

  return (
    <div className={type === 'success' ? styles.messageSuccess : styles.messageError}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
        <span>{message}</span>
        <button 
          onClick={onClose}
          style={{ 
            marginLeft: 'auto', 
            background: 'none', 
            border: 'none', 
            color: type === 'success' ? 'var(--success)' : 'var(--danger)', 
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;