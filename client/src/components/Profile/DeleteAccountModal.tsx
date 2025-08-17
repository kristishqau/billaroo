import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';

interface UnpaidInvoice {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
}

interface ActiveProject {
  title: string;
  clientName: string;
  deadline: string;
}

interface DeleteAccountModalProps {
  show: boolean;
  onClose: () => void;
  deletePassword: string;
  setDeletePassword: (password: string) => void;
  deleteConfirmationText: string;
  setDeleteConfirmationText: (text: string) => void;
  deleteWarning: string | null;
  unpaidInvoices: UnpaidInvoice[];
  activeProjects: ActiveProject[];
  canForceDelete: boolean;
  requiresAcknowledgment: boolean;
  forceDeleteChecked: boolean;
  setForceDeleteChecked: (checked: boolean) => void;
  acknowledgeDataLossChecked: boolean;
  setAcknowledgeDataLossChecked: (checked: boolean) => void;
  formatDate: (date: string) => string;
  onRequestDeletion: () => void;
  onDeleteAccount: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  show,
  onClose,
  deletePassword,
  setDeletePassword,
  deleteConfirmationText,
  setDeleteConfirmationText,
  deleteWarning,
  unpaidInvoices,
  activeProjects,
  canForceDelete,
  requiresAcknowledgment,
  forceDeleteChecked,
  setForceDeleteChecked,
  acknowledgeDataLossChecked,
  setAcknowledgeDataLossChecked,
  formatDate,
  onRequestDeletion,
  onDeleteAccount,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>
          <AlertTriangle size={24} /> Confirm Account Deletion
        </h3>
        <p className={styles.modalDescription}>
          Deleting your account is a permanent action and will remove all your data.
          This cannot be undone.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="deletePassword" className={styles.formLabel}>Enter your password to proceed</label>
          <input
            id="deletePassword"
            type="password"
            className={styles.formInput}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            onBlur={onRequestDeletion}
            required
          />
        </div>

        {deleteWarning && (
          <div className={styles.modalWarning}>
            <AlertTriangle size={20} />
            <div>
              <p>{deleteWarning}</p>
              {unpaidInvoices.length > 0 && (
                <>
                  <p>You have unpaid invoices:</p>
                  <ul>
                    {unpaidInvoices.map((inv, i) => (
                      <li key={i}>
                        {inv.invoiceNumber} (Client: {inv.clientName}, Amount: ${inv.amount}, Status: {inv.status})
                      </li>
                    ))}
                  </ul>
                  {canForceDelete && (
                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                      <input
                        type="checkbox"
                        checked={forceDeleteChecked}
                        onChange={(e) => setForceDeleteChecked(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Force Delete (I understand this will delete all associated data even with unpaid invoices)
                    </label>
                  )}
                </>
              )}
              {activeProjects.length > 0 && (
                <>
                  <p>You have active projects:</p>
                  <ul>
                    {activeProjects.map((proj, i) => (
                      <li key={i}>
                        {proj.title} (Client: {proj.clientName}, Deadline: {formatDate(proj.deadline)})
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {requiresAcknowledgment && (
                <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={acknowledgeDataLossChecked}
                    onChange={(e) => setAcknowledgeDataLossChecked(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  I understand that deleting my account will permanently remove all my data.
                </label>
              )}
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="confirmText" className={styles.formLabel}>Type "DELETE MY ACCOUNT" to confirm</label>
          <input
            id="confirmText"
            type="text"
            className={styles.formInput}
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            required
          />
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancelButton}>
            Cancel
          </button>
          <button onClick={onDeleteAccount} className={styles.modalConfirmButton}
            disabled={
              deleteConfirmationText !== 'DELETE MY ACCOUNT' ||
              (requiresAcknowledgment && !acknowledgeDataLossChecked) ||
              (canForceDelete && !forceDeleteChecked)
            }
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;