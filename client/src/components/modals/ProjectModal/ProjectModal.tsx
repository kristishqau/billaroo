import { useState, useEffect } from "react";
import styles from "./ProjectModal.module.css";
import { Plus, Edit, X } from 'lucide-react';
import type { Client } from "../../../pages/Clients/Clients";

export type Project = {
  id?: number;
  title: string;
  description: string;
  deadline: string;
  clientId: number;
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id'>) => Promise<void>;
  project?: Project | null; // For editing
  clients: Client[];
  mode?: 'add' | 'edit';
}

export default function ProjectModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  project = null, 
  clients = [],
  mode = 'add' 
}: ProjectModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    clientId: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (isOpen) {
      if (project && mode === 'edit') {
        setFormData({
          title: project.title || "",
          description: project.description || "",
          deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "",
          clientId: project.clientId || 0
        });
      } else {
        setFormData({
          title: "",
          description: "",
          deadline: "",
          clientId: 0
        });
      }
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, project, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Project title is required");
      return;
    }

    if (!formData.deadline) {
      setError("Project deadline is required");
      return;
    }

    if (!formData.clientId) {
      setError("Please select a client");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      
      const projectData = {
        ...formData,
        deadline: new Date(formData.deadline).toISOString()
      };
      
      await onSubmit(projectData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${mode} project`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'clientId' ? parseInt(value) : value
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
            {mode === 'edit' ? <Edit size={24} /> : <Plus size={24} />}
            {mode === 'edit' ? 'Edit Project' : 'Create New Project'}
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
            <label htmlFor="title" className={styles.formLabel}>
              Project Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter project title"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.formLabel}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Describe the project goals and requirements"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientId" className={styles.formLabel}>
              Client *
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className={styles.formSelect}
              required
              disabled={isSubmitting}
            >
              <option value={0}>Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.username} {client.company && `(${client.company})`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="deadline" className={styles.formLabel}>
              Deadline *
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={styles.formInput}
              required
              min={new Date().toISOString().split('T')[0]}
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
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? <Edit size={16} /> : <Plus size={16} />}
                  {mode === 'edit' ? 'Update Project' : 'Create Project'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}