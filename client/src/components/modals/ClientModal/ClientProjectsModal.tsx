import { useState, useEffect } from "react";
import styles from "./ClientProjectsModal.module.css";
import { 
  FolderOpen,
  Calendar, 
  Clock,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import axios from "../../../api/axios";

export type Project = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  clientId: number;
  status?: 'completed' | 'active' | 'pending';
};

export type Client = {
  id: number;
  name: string;
  email: string;
  company: string;
};

interface ClientProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onViewProject?: (projectId: number) => void;
  onEditProject?: (project: Project) => void;
}

export default function ClientProjectsModal({
  isOpen,
  onClose,
  client,
  onEditProject
}: ClientProjectsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && client?.id) {
      fetchClientProjects();
    }
  }, [isOpen, client]);

  const fetchClientProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get<Project[]>(`/clients/${client.id}/projects`);
      setProjects(response.data);
    } catch (err: any) {
      console.error("Fetch client projects error:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      return { status: 'overdue', className: styles.deadlineOverdue, text: 'Overdue' };
    } else if (daysUntilDeadline <= 7) {
      return { status: 'soon', className: styles.deadlineSoon, text: `${daysUntilDeadline} days left` };
    } else {
      return { status: 'normal', className: '', text: `${daysUntilDeadline} days left` };
    }
  };

  const getProjectStatusClass = (status?: string) => {
    switch (status) {
      case 'completed': return styles.statusCompleted;
      case 'active': return styles.statusActive;
      case 'pending': return styles.statusPending;
      default: return styles.statusActive;
    }
  };

  const getProjectStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={12} />;
      case 'active': return <Clock size={12} />;
      case 'pending': return <AlertCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FolderOpen size={24} />
            Projects
            <span>for {client.name}</span>
          </h2>
        </header>
        
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading projects...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <AlertCircle size={48} />
              </div>
              <h3 className={styles.emptyTitle}>Error Loading Projects</h3>
              <p className={styles.emptyDescription}>
                {error}. Please try again or contact support if the problem persists.
              </p>
              <button
                className={styles.emptyAction}
                onClick={fetchClientProjects}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FolderOpen size={48} />
              </div>
              <h3 className={styles.emptyTitle}>No projects yet</h3>
              <p className={styles.emptyDescription}>
                This client doesn't have any projects. Create a project to start tracking work and progress.
              </p>
            </div>
          ) : (
            <div className={styles.projectsList}>
              {projects.map((project) => {
                const deadlineStatus = getDeadlineStatus(project.deadline);
                
                return (
                  <div key={project.id} className={styles.projectCard}>
                    <div className={styles.projectHeader}>
                      <div className={styles.projectInfo}>
                        <h3 className={styles.projectTitle}>{project.title}</h3>
                        {project.description && (
                          <p className={styles.projectDescription}>
                            {project.description.length > 150 
                              ? `${project.description.substring(0, 150)}...`
                              : project.description
                            }
                          </p>
                        )}
                      </div>
                      <div className={styles.projectMeta}>
                        <div className={`${styles.projectDeadline} ${deadlineStatus.className}`}>
                          <Calendar size={14} />
                          <span>{formatDate(project.deadline)}</span>
                        </div>
                        <div className={`${styles.projectStatus} ${getProjectStatusClass(project.status)}`}>
                          {getProjectStatusIcon(project.status)}
                          {project.status || 'active'}
                        </div>
                      </div>
                    </div>

                    <div className={styles.projectActions}>
                      {onEditProject && (
                        <button
                          className={`${styles.actionButton} ${styles.secondaryAction}`}
                          onClick={() => {
                            onEditProject(project);
                            onClose();
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      )}

                      <button
                        className={`${styles.actionButton} ${styles.secondaryAction}`}
                        onClick={() => {
                          // Handle view project files/documents
                          console.log('View project files:', project.id);
                        }}
                      >
                        <FileText size={14} />
                        Files
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.modalActionButton} ${styles.modalSecondaryAction}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}