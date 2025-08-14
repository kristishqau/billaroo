import { useState } from "react";
import styles from "./SendInvoiceModal.module.css";
import { Send, X, Mail, FileText, AlertCircle } from 'lucide-react';
import React from "react";

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
};

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invoiceId: number, emailData: SendEmailData) => Promise<void>;
  invoice: Invoice | null;
}

export type SendEmailData = {
  to: string;
  subject: string;
  message: string;
  includeAttachment: boolean;
};

export default function SendInvoiceModal({
  isOpen,
  onClose,
  onSend,
  invoice
}: SendInvoiceModalProps) {
  const [emailData, setEmailData] = useState<SendEmailData>({
    to: "",
    subject: "",
    message: "",
    includeAttachment: true
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when modal opens or invoice changes
  React.useEffect(() => {
    if (isOpen && invoice) {
      setEmailData({
        to: invoice.clientEmail || "",
        subject: `Invoice #${invoice.invoiceNumber} - ${invoice.title}`,
        message: `Dear ${invoice.clientName || 'Client'},\n\nPlease find attached your invoice #${invoice.invoiceNumber} for the project "${invoice.projectTitle}".\n\nInvoice Details:\n- Amount: $${invoice.amount.toFixed(2)}\n- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business!\n\nBest regards`,
        includeAttachment: true
      });
      setError("");
      setIsSending(false);
    }
  }, [isOpen, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;

    // Validation
    if (!emailData.to.trim()) {
      setError("Email address is required");
      return;
    }

    if (!emailData.subject.trim()) {
      setError("Subject is required");
      return;
    }

    if (!emailData.message.trim()) {
      setError("Message is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      
      await onSend(invoice.id, emailData);
      onClose();
    } catch (err: any) {
      console.error('Send invoice error:', err);
      setError(err.response?.data?.message || "Failed to send invoice");
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (field: keyof SendEmailData, value: string | boolean) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Send size={24} />
            Send Invoice
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSending}
          >
            <X size={20} />
          </button>
        </header>
        
        {/* Invoice Preview */}
        <div className={styles.invoicePreview}>
          <div className={styles.previewHeader}>
            <FileText size={20} />
            <div className={styles.previewInfo}>
              <h4 className={styles.previewTitle}>
                Invoice #{invoice.invoiceNumber}
              </h4>
              <p className={styles.previewSubtitle}>
                {invoice.title} - ${invoice.amount.toFixed(2)}
              </p>
            </div>
          </div>
          <div className={styles.previewDetails}>
            <p><strong>Project:</strong> {invoice.projectTitle}</p>
            <p><strong>Client:</strong> {invoice.clientName}</p>
            <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span className={`${styles.statusBadge} ${styles[invoice.status.toLowerCase()]}`}>{invoice.status}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="to" className={styles.formLabel}>
              <Mail size={16} />
              Send To *
            </label>
            <input
              type="email"
              id="to"
              value={emailData.to}
              onChange={(e) => handleChange('to', e.target.value)}
              className={styles.formInput}
              placeholder="client@example.com"
              required
              disabled={isSending}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject" className={styles.formLabel}>
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={emailData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className={styles.formInput}
              placeholder="Invoice subject line"
              required
              disabled={isSending}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.formLabel}>
              Message *
            </label>
            <textarea
              id="message"
              value={emailData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              className={`${styles.formInput} ${styles.textarea}`}
              placeholder="Email message content"
              required
              disabled={isSending}
              rows={8}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={emailData.includeAttachment}
                onChange={(e) => handleChange('includeAttachment', e.target.checked)}
                className={styles.checkbox}
                disabled={isSending}
              />
              <span className={styles.checkboxText}>
                Include PDF invoice attachment
              </span>
            </label>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className={styles.modalActions}>
            <button 
              type="button"
              className={`${styles.actionButton} ${styles.secondaryAction}`}
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`${styles.actionButton} ${styles.primaryAction}`}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <div className={styles.spinner}></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}