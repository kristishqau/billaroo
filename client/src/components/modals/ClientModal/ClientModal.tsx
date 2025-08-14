import { useState, useEffect } from "react";
import styles from "./ClientModal.module.css";
import { UserPlus, Edit, X } from 'lucide-react';

export type Client = {
  id?: number;
  name: string;
  email: string;
  company: string;
};

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => Promise<void>;
  client?: Client | null; // For editing
  mode?: 'add' | 'edit';
}

export default function ClientModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  client = null, 
  mode = 'add' 
}: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen) {
      if (client && mode === 'edit') {
        setFormData({
          name: client.name || "",
          email: client.email || "",
          company: client.company || ""
        });
      } else {
        setFormData({
          name: "",
          email: "",
          company: ""
        });
      }
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, client, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Client name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${mode} client`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'edit' ? <Edit size={24} /> : <UserPlus size={24} />}
            {mode === 'edit' ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter client's full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="client@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="company" className={styles.formLabel}>
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Company name (optional)"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.modalActions}>
            <button 
              type="button"
              className={`${styles.actionButton} ${styles.secondaryAction}`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`${styles.actionButton} ${styles.primaryAction}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner}></div>
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? <Edit size={16} /> : <UserPlus size={16} />}
                  {mode === 'edit' ? 'Update Client' : 'Add Client'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}