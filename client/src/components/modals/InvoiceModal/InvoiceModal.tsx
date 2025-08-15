import { useState, useEffect } from "react";
import styles from "./InvoiceModal.module.css";
import { FileText, Plus, X, Trash2, Calculator } from 'lucide-react';

// Separate types for create/update vs display
export type CreateInvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceItem = {
  id?: number;
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

export type CreateInvoice = {
  title: string;
  description: string;
  projectId: number;
  dueDate: string;
  items: CreateInvoiceItem[]; // Use CreateInvoiceItem for API calls
};

export type Invoice = {
  id?: number;
  title: string;
  description: string;
  projectId: number;
  dueDate: string;
  items: InvoiceItem[]; // Use full InvoiceItem for display
  amount?: number;
};

export type Project = {
  id: number;
  title: string;
  clientName: string;
};

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: CreateInvoice) => Promise<void>;
  projects: Project[];
  invoice?: Invoice | null;
  mode?: 'add' | 'edit';
  initialClientId?: number;
}

// Internal type for form state (includes total for UI calculations)
type FormInvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

type FormData = {
  title: string;
  description: string;
  projectId: number;
  dueDate: string;
  items: FormInvoiceItem[];
};

export default function InvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  projects,
  invoice = null,
  mode = 'add'
}: InvoiceModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    projectId: 0,
    dueDate: "",
    items: [{ description: "", quantity: 1, rate: 0, total: 0 }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or invoice changes
  useEffect(() => {
    if (isOpen) {
      if (invoice && mode === 'edit') {
        setFormData({
          title: invoice.title || "",
          description: invoice.description || "",
          projectId: invoice.projectId || 0,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
          items: invoice.items.length > 0 ? invoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total
          })) : [{ description: "", quantity: 1, rate: 0, total: 0 }]
        });
      } else {
        // Set default due date to 30 days from now
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        
        setFormData({
          title: "",
          description: "",
          projectId: projects.length > 0 ? projects[0].id : 0,
          dueDate: defaultDueDate.toISOString().split('T')[0],
          items: [{ description: "", quantity: 1, rate: 0, total: 0 }]
        });
      }
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, invoice, mode, projects]);

  const calculateItemTotal = (quantity: number, rate: number) => {
    return Number((quantity * rate).toFixed(2));
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleItemChange = <K extends keyof FormInvoiceItem>(
    index: number,
    field: K,
    value: FormInvoiceItem[K]
    ) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    if (field === 'quantity' || field === 'rate') {
        const numValue = Number(value) || 0;
        item[field] = numValue as FormInvoiceItem[K];
        item.total = calculateItemTotal(item.quantity, item.rate);
    } else {
        item[field] = value as FormInvoiceItem[K];
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));

    if (error) setError("");
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError("Invoice title is required");
      return;
    }
    
    if (!formData.projectId) {
      setError("Please select a project");
      return;
    }
    
    if (!formData.dueDate) {
      setError("Due date is required");
      return;
    }

    if (formData.items.length === 0 || formData.items.every(item => !item.description.trim())) {
      setError("At least one invoice item is required");
      return;
    }

    // Filter out empty items and format for API (without total field)
    const validItems: CreateInvoiceItem[] = formData.items
      .filter(item => item.description.trim())
      .map(item => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        rate: Number(item.rate)
        // Note: total is NOT included as it's calculated on the backend
      }));
    
    if (validItems.length === 0) {
      setError("At least one valid invoice item is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      
      // Format date as ISO string for backend
      const dueDateISO = new Date(formData.dueDate + 'T00:00:00.000Z').toISOString();
      
      const invoiceData: CreateInvoice = {
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        projectId: Number(formData.projectId),
        dueDate: dueDateISO,
        items: validItems
      };
      
      console.log('Sending invoice data:', invoiceData); // Debug log
      await onSubmit(invoiceData);
      onClose();
    } catch (err: any) {
      console.error('Invoice submission error:', err); // Debug log
      setError(err.response?.data?.message || `Failed to ${mode} invoice`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof Omit<FormData, 'items'>, value: string | number) => {
    setFormData(prev => ({
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FileText size={24} />
            {mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
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
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>
                Invoice Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={styles.formInput}
                placeholder="Enter invoice title"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="projectId" className={styles.formLabel}>
                Project *
              </label>
              <select
                id="projectId"
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', Number(e.target.value))}
                className={styles.formInput}
                required
                disabled={isSubmitting}
              >
                <option value={0}>Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title} - {project.clientName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.formLabel}>
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`${styles.formInput} ${styles.textarea}`}
              placeholder="Invoice description (optional)"
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dueDate" className={styles.formLabel}>
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className={styles.formInput}
              required
              disabled={isSubmitting}
            />
          </div>

          {selectedProject && (
            <div className={styles.projectInfo}>
              <h4 className={styles.projectInfoTitle}>Project Details</h4>
              <p><strong>Project:</strong> {selectedProject.title}</p>
              <p><strong>Client:</strong> {selectedProject.clientName}</p>
            </div>
          )}

          {/* Invoice Items */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h3 className={styles.itemsTitle}>Invoice Items</h3>
              <button
                type="button"
                className={styles.addItemButton}
                onClick={addItem}
                disabled={isSubmitting}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className={styles.itemsList}>
              {formData.items.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.itemField}>
                    <label className={styles.itemLabel}>Description *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className={styles.itemInput}
                      placeholder="Item description"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className={styles.itemField}>
                    <label className={styles.itemLabel}>Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className={styles.itemInput}
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className={styles.itemField}>
                    <label className={styles.itemLabel}>Rate ($)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                      className={styles.itemInput}
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeItemButton}
                      onClick={() => removeItem(index)}
                      disabled={isSubmitting}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.grandTotal}>
              <div className={styles.grandTotalContent}>
                <Calculator size={20} />
                <span className={styles.grandTotalLabel}>Grand Total:</span>
                <span className={styles.grandTotalValue}>
                  {formatCurrency(calculateGrandTotal())}
                </span>
              </div>
            </div>
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
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FileText size={16} />
                  {mode === 'edit' ? 'Update Invoice' : 'Create Invoice'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}