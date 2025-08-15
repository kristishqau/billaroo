import React from 'react';
import type { Client } from '../../../pages/Clients/Clients';
import type { Project } from '../../../pages/Projects/Projects';
import styles from './InvoiceViewModal.module.css';
import tableStyles from '../../Table/Table.module.css';
import {
  FileText,
  Plus,
  Calendar,
  Send
} from 'lucide-react';
import type { SendEmailData } from './SendInvoiceModal';

// Common types for invoices, items, and payments
type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

type Payment = {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
};

export type ViewableEntity = Client | Project;

export type Invoice = {
  id: number;
  invoiceNumber: string;
  title: string;
  description?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  projectId: number;
  projectTitle: string;
  clientId: number;
  clientName: string;
  clientEmail?: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: InvoiceItem[];
  payments: Payment[];
};

// Props for the InvoiceViewModal component
interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: ViewableEntity | null;
  invoices: Invoice[];
  loading: boolean;
  onOpenCreateInvoice: (entity: ViewableEntity) => void;
  onSendInvoice: (invoiceId: number, emailData: SendEmailData) => Promise<void>;
  titlePrefix: string;
  emptyStateMessage: string;
}

// Utility functions (can be moved to a separate file if needed)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getInvoiceStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return tableStyles.completed;
    case 'overdue':
      return tableStyles.overdue;
    case 'sent':
      return tableStyles.active;
    default:
      return tableStyles.pending;
  }
};

const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  isOpen,
  onClose,
  entity,
  invoices,
  loading,
  onOpenCreateInvoice,
  onSendInvoice,
  titlePrefix,
  emptyStateMessage
}) => {
  if (!isOpen || !entity) return null;

  const entityTitle = (entity as Project).title || (entity as Client).name;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FileText size={24} />
            {titlePrefix} {entityTitle}
          </h2>
        </header>

        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <FileText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No invoices yet</h3>
              <p style={{ color: '#94a3b8' }}>
                {emptyStateMessage}
              </p>
            </div>
          ) : (
            <div className={styles.invoicesList}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div className={styles.invoiceInfo}>
                      <h4 className={styles.invoiceTitle}>
                        #{invoice.invoiceNumber}
                      </h4>
                      <p className={styles.invoiceDescription}>
                        {invoice.title || 'No title'}
                      </p>
                    </div>
                    <div className={styles.invoiceAmount}>
                      {formatCurrency(invoice.amount)}
                    </div>
                  </div>

                  <div className={styles.invoiceDetails}>
                    <div className={styles.invoiceDate}>
                      <Calendar size={14} />
                      <span>Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className={styles.invoiceStatus}>
                      <span className={`${tableStyles.statusBadge} ${getInvoiceStatusBadgeClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.invoiceActions}>
                    {(invoice.status === 'draft' || invoice.status === 'pending') && (
                      <button
                        className={`${styles.actionButton}`}
                        onClick={() => {
                          onClose();
                          onSendInvoice(invoice.id);
                        }}
                      >
                        <Send size={14} />
                        Send
                      </button>
                    )}
                  </div>

                  {invoice.items.length > 0 && (
                    <div className={styles.invoiceItems}>
                      <h5>Items:</h5>
                      <ul>
                        {invoice.items.map((item) => (
                          <li key={item.id}>
                            {item.description} - {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.total)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {invoice.payments.length > 0 && (
                    <div className={styles.invoicePayments}>
                      <h5>Payments:</h5>
                      <ul>
                        {invoice.payments.map((payment) => (
                          <li key={payment.id}>
                            {formatCurrency(payment.amount)} on {formatDate(payment.paymentDate)} ({payment.method})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.actionButton} ${styles.primaryAction}`}
            onClick={() => {
              onClose();
              onOpenCreateInvoice(entity);
            }}
          >
            <Plus size={16} />
            Create New Invoice
          </button>
          <button
            className={`${styles.actionButton} ${styles.secondaryAction}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;