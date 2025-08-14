import { useState, useEffect } from "react";
import styles from "./Projects.module.css";
import tableStyles from "../../components/Table/Table.module.css";
import { useAuth } from "../../context/AuthContext";
import ProjectModal, { type Project as ProjectModalType } from "../../components/modals/ProjectModal/ProjectModal";
import InvoiceModal, { type CreateInvoice, type Invoice as InvoiceModalType } from "../../components/modals/InvoiceModal/InvoiceModal";
import { type SendEmailData } from "../../components/modals/InvoiceModal/SendInvoiceModal";
import Navbar from "../../components/Navbar/Navbar";
import Table, { type Column } from "../../components/Table/Table";
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  Download,
  X,
  Send
} from 'lucide-react';
import axios from "../../api/axios";

type Project = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  clientId: number;
  clientName: string;
  clientCompany: string;
  clientEmail?: string;
  invoiceCount: number;
  fileCount: number;
  isOverdue: boolean;
  isCompleted?: boolean;
  totalInvoiceAmount: number;
};

type Client = {
  id: number;
  name: string;
  email: string;
  company: string;
};

type ProjectStats = {
  totalProjects: number;
  activeProjects: number;
  overdueProjects: number;
  completedProjects: number;
  totalRevenue: number;
  avgProjectValue: number;
};

// Invoice types
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

type Invoice = {
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

export default function Projects() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'deadline' | 'client'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Invoice viewing states
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Invoice creation states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user?.role === "freelancer") {
      fetchProjects();
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    // Only calculate stats after projects are fetched
    if (projects.length > 0 || !loading) {
      fetchProjectStats();
    }
  }, [projects, loading]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get<Project[]>("/projects");
      setProjects(response.data);
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setError("Failed to load projects");
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get<Client[]>("/clients");
      setClients(response.data);
    } catch (err: any) {
      console.error("Fetch clients error:", err);
    }
  };

  const fetchProjectStats = () => {
    // Calculate stats from projects data
    const stats: ProjectStats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => !p.isOverdue && !p.isCompleted).length,
      overdueProjects: projects.filter(p => p.isOverdue && !p.isCompleted).length,
      completedProjects: projects.filter(p => p.isCompleted).length,
      totalRevenue: projects.reduce((sum, p) => sum + p.totalInvoiceAmount, 0),
      avgProjectValue: projects.length > 0 ? projects.reduce((sum, p) => sum + p.totalInvoiceAmount, 0) / projects.length : 0
    };
    setProjectStats(stats);
  };

  // Fetch invoices for a specific project
  const fetchProjectInvoices = async (projectId: number) => {
    try {
      setLoadingInvoices(true);
      const response = await axios.get<Invoice[]>(`/projects/${projectId}/invoices`);
      setProjectInvoices(response.data);
    } catch (err: any) {
      console.error("Fetch project invoices error:", err);
      setError("Failed to load project invoices");
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle viewing invoices for a project
  const handleViewInvoices = async (project: Project) => {
    setSelectedProject(project);
    setShowInvoicesModal(true);
    await fetchProjectInvoices(project.id);
  };

  // Handle creating a new invoice for a project
  const handleCreateInvoice = (project: Project) => {
    setSelectedProject(project);
    setEditingInvoice(null);
    setShowInvoiceModal(true);
  };

  // Handle invoice creation/update
  const handleInvoiceSubmit = async (invoiceData: CreateInvoice) => {
    try {
      if (editingInvoice) {
        const response = await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
        // Update the invoice in the projectInvoices list if it's currently displayed
        setProjectInvoices(prev => 
          prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...response.data } : inv)
        );
      } else {
        const response = await axios.post("/invoices", invoiceData);
        // Add the new invoice to the projectInvoices list if we're viewing invoices for this project
        if (selectedProject?.id === invoiceData.projectId) {
          setProjectInvoices(prev => [...prev, response.data]);
        }
      }
      
      // Refresh projects to update invoice counts and totals
      await fetchProjects();
      setShowInvoiceModal(false);
      setEditingInvoice(null);
    } catch (err: any) {
      console.error("Invoice submission error:", err);
      throw err; // Re-throw to let InvoiceModal handle the error display
    }
  };

  // Handle sending an invoice
  const handleSendInvoice = async (invoiceId: number, emailData: SendEmailData) => {
    try {
      await axios.post(`/invoices/${invoiceId}/send`, emailData);
      
      // Update the invoice status in the local state
      setProjectInvoices(prev =>
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'sent', sentAt: new Date().toISOString() }
            : inv
        )
      );
      
      // Refresh projects to update any status changes
      await fetchProjects();
    } catch (err: any) {
      console.error("Send invoice error:", err);
      throw err; // Re-throw to let SendInvoiceModal handle the error display
    }
  };

  const handleProjectSubmit = async (projectData: Omit<ProjectModalType, 'id'>) => {
    try {
      if (editingProject) {
        const response = await axios.put(`/projects/${editingProject.id}`, projectData);
        setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...response.data } : p));
      } else {
        const response = await axios.post("/projects", projectData);
        setProjects([...projects, response.data]);
      }
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save project");
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(p => !p.isOverdue && !p.isCompleted);
          break;
        case 'overdue':
          filtered = filtered.filter(p => p.isOverdue && !p.isCompleted);
          break;
        case 'completed':
          filtered = filtered.filter(p => p.isCompleted);
          break;
      }
    }

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
          break;
        case 'client':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    setFilteredProjects(filtered);
  };

  const handleSort = (field: 'title' | 'deadline' | 'client', order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await axios.delete(`/projects/${projectToDelete.id}`);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  const handleSelectProject = (projectId: number | string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId as number)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId as number]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStatus = (project: Project) => {
    if (project.isCompleted) return 'completed';
    if (project.isOverdue) return 'overdue';
    return 'active';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'overdue': return tableStyles.overdue;
      case 'completed': return tableStyles.completed;
      default: return tableStyles.active;
    }
  };

  const getInvoiceStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return tableStyles.completed;
      case 'overdue': return tableStyles.overdue;
      case 'sent': return tableStyles.active;
      default: return tableStyles.pending;
    }
  };

  // Define columns for the Projects Table
  const projectColumns: Column<Project>[] = [
    {
      key: 'checkbox',
      header: '',
      gridColumnWidth: '50px',
    },
    {
      key: 'title',
      header: 'Project',
      sortable: true,
      gridColumnWidth: '290px',
      render: (project) => (
        <div className={tableStyles.projectInfo}>
          <div className={tableStyles.projectIcon}>
            <FolderOpen size={20} />
          </div>
          <div className={tableStyles.projectDetails}>
            <h4 className={tableStyles.projectTitle}>{project.title}</h4>
            <p className={tableStyles.projectDescription} title={project.description}>
              {project.description || "No description"}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      sortable: true,
      gridColumnWidth: '180px',
      render: (project) => (
        <div className={tableStyles.cellWithIcon}>
          <User size={14} />
          <div className={tableStyles.clientInfo}>
            <div className={tableStyles.clientName}>
              {project.clientName || "Unknown Client"}
            </div>
            {project.clientCompany && (
              <div className={tableStyles.clientCompany}>
                {project.clientCompany}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true,
      gridColumnWidth: '150px',
      render: (project) => (
        <div className={tableStyles.cellWithIcon}>
          <Calendar size={14} />
          <div className={tableStyles.deadlineInfo}>
            <div className={tableStyles.deadlineDate}>
              {formatDate(project.deadline)}
            </div>
            <div className={tableStyles.deadlineTime}>
              {project.isCompleted ? 'Completed' : project.isOverdue ? 'Overdue' : 'Due'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      gridColumnWidth: '120px',
      render: (project) => {
        const status = getProjectStatus(project);
        return (
          <div className={tableStyles.statusCell}>
            <span className={`${tableStyles.statusBadge} ${getStatusBadgeClass(status)}`}>
              {status === 'overdue' && <AlertTriangle size={12} />}
              {status === 'active' && <Clock size={12} />}
              {status === 'completed' && <CheckCircle size={12} />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        );
      }
    },
    {
      key: 'invoices',
      header: 'Invoices',
      gridColumnWidth: '140px',
      render: (project) => (
        <div className={tableStyles.cellWithIcon}>
          <FileText size={14} />
          <div className={tableStyles.invoicesInfo}>
            {project.invoiceCount} ({formatCurrency(project.totalInvoiceAmount)})
          </div>
        </div>
      )
    },
    {
      key: 'files',
      header: 'Files',
      gridColumnWidth: '100px',
      render: (project) => (
        <div className={tableStyles.cellWithIcon}>
          <FolderOpen size={14} />
          <div className={tableStyles.filesInfo}>
            {project.fileCount}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      gridColumnWidth: '20px',
      render: (project) => (
        <>
          <button
            className={tableStyles.dropdownItem}
            onClick={() => {
              setEditingProject(project);
              setShowProjectModal(true);
            }}
          >
            <Edit size={14} />
            Edit Project
          </button>
          <button 
            className={tableStyles.dropdownItem}
            onClick={() => handleViewInvoices(project)}
          >
            <FileText size={14} />
            View Invoices ({project.invoiceCount})
          </button>
          <button 
            className={tableStyles.dropdownItem}
            onClick={() => handleCreateInvoice(project)}
          >
            <Plus size={14} />
            Create Invoice
          </button>
          <button className={tableStyles.dropdownItem}>
            <FolderOpen size={14} />
            Manage Files
          </button>
          <hr className={tableStyles.dropdownDivider} />
          <button
            className={`${tableStyles.dropdownItem} ${tableStyles.danger}`}
            onClick={() => {
              setProjectToDelete(project);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={14} />
            Delete Project
          </button>
        </>
      )
    }
  ];

  const emptyProjectsState = (
    <>
      <div className={tableStyles.emptyIcon}>
        <FolderOpen size={64} />
      </div>
      <h3 className={tableStyles.emptyTitle}>
        {searchTerm || statusFilter !== 'all' ? "No projects found" : "No projects yet"}
      </h3>
      <p className={tableStyles.emptyDescription}>
        {searchTerm || statusFilter !== 'all'
          ? "Try adjusting your search terms or filters to find the projects you're looking for."
          : "Start building your project portfolio by creating your first project. You can track progress, manage files, and create invoices all in one place."
        }
      </p>
      {!searchTerm && statusFilter === 'all' && (
        <button
          className={tableStyles.emptyAction}
          onClick={() => setShowProjectModal(true)}
        >
          <Plus size={16} />
          Create Your First Project
        </button>
      )}
    </>
  );

  if (user?.role !== "freelancer") {
    return (
      <div className={styles.projectsContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.projectsContent}>
          <div className={tableStyles.errorContainer}>
            <h2>Access Denied</h2>
            <p>Only freelancers can manage projects.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.projectsContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.projectsContent}>
          <div className={tableStyles.loadingContainer}>
            <div className={tableStyles.spinner}></div>
            <p className={tableStyles.loadingText}>Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectsContainer}>
      <Navbar variant="dashboard" />

      <div className={styles.projectsContent}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>
                <FolderOpen size={32} />
                Projects
              </h1>
              <p className={styles.pageSubtitle}>
                Manage your projects, track deadlines, and monitor progress
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={`${styles.actionButton} ${styles.secondaryAction}`}
                onClick={fetchProjects}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                className={`${styles.actionButton} ${styles.primaryAction}`}
                onClick={() => setShowProjectModal(true)}
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        {projectStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FolderOpen size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Total Projects</h3>
                <p className={styles.statValue}>{projectStats.totalProjects}</p>
                <span className={styles.statSubtext}>Active portfolio</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.overdue}`}>
              <div className={styles.statIcon}>
                <AlertTriangle size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Overdue</h3>
                <p className={styles.statValue}>{projectStats.overdueProjects}</p>
                <span className={styles.statSubtext}>Need attention</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.upcoming}`}>
              <div className={styles.statIcon}>
                <Clock size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Active</h3>
                <p className={styles.statValue}>{projectStats.activeProjects}</p>
                <span className={styles.statSubtext}>In progress</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.completed}`}>
              <div className={styles.statIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Completed</h3>
                <p className={styles.statValue}>{projectStats.completedProjects}</p>
                <span className={styles.statSubtext}>Finished work</span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className={styles.controlsBar}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search projects by title, description, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.controlsActions}>
            <div className={styles.filterSection}>
              <Filter size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {selectedProjects.length > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectedCount}>
                  {selectedProjects.length} selected
                </span>
                <button className={styles.bulkButton}>
                  <Download size={16} />
                  Export
                </button>
                <button className={styles.bulkButton}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <Table
          data={filteredProjects}
          columns={projectColumns}
          onRowSelect={handleSelectProject}
          onSelectAll={handleSelectAll}
          selectedIds={selectedProjects}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          emptyStateContent={emptyProjectsState}
          getRowId={(project) => project.id}
        />

        {/* Project Modal */}
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSubmit={handleProjectSubmit}
          project={editingProject}
          clients={clients}
          mode={editingProject ? 'edit' : 'add'}
        />

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setEditingInvoice(null);
            setSelectedProject(null);
          }}
          onSubmit={handleInvoiceSubmit}
          onSendInvoice={handleSendInvoice}
          projects={projects.filter(p => selectedProject ? p.id === selectedProject.id : true).map(p => ({
            id: p.id,
            title: p.title,
            clientName: p.clientName,
            clientEmail: p.clientEmail
          }))}
          invoice={editingInvoice ? {
            id: editingInvoice.id,
            title: editingInvoice.title,
            description: editingInvoice.description || '',
            projectId: editingInvoice.projectId,
            dueDate: editingInvoice.dueDate,
            items: editingInvoice.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              total: item.total
            })),
            amount: editingInvoice.amount
          } : null}
          mode={editingInvoice ? 'edit' : 'add'}
          showSendOption={!!editingInvoice}
        />

        {/* Project Invoices Modal */}
        {showInvoicesModal && selectedProject && (
          <div className={styles.modalOverlay} onClick={() => setShowInvoicesModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <header className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <FileText size={24} />
                  Invoices for {selectedProject.title}
                </h2>
              </header>

              <div className={styles.modalContent}>
                {loadingInvoices ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading invoices...</p>
                  </div>
                ) : projectInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <FileText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                    <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No invoices yet</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                      This project doesn't have any invoices. Create an invoice to start billing your client.
                    </p>
                    <button
                      className={`${styles.actionButton} ${styles.primaryAction}`}
                      onClick={() => {
                        setShowInvoicesModal(false);
                        handleCreateInvoice(selectedProject);
                      }}
                    >
                      <Plus size={16} />
                      Create Invoice
                    </button>
                  </div>
                ) : (
                  <div className={styles.invoicesList}>
                    {projectInvoices.map((invoice) => (
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
                              className={`${styles.actionButton} ${styles.sendAction}`}
                              onClick={() => {
                                setShowInvoicesModal(false);
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
                    setShowInvoicesModal(false);
                    handleCreateInvoice(selectedProject);
                  }}
                >
                  <Plus size={16} />
                  Create New Invoice
                </button>
                <button
                  className={`${styles.actionButton} ${styles.secondaryAction}`}
                  onClick={() => setShowInvoicesModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && projectToDelete && (
          <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <header className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <Trash2 size={24} />
                  Delete Project
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X size={20} />
                </button>
              </header>

              <div className={styles.modalContent}>
                <p className={styles.confirmationText}>
                  Are you sure you want to delete <strong>{projectToDelete.title}</strong>?
                </p>
                <p className={styles.warningText}>
                  This action cannot be undone. All associated files and data will also be removed.
                  {projectToDelete.invoiceCount > 0 && (
                    ` Note: This project has ${projectToDelete.invoiceCount} invoice(s) that may be affected.`
                  )}
                </p>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={`${styles.actionButton} ${styles.secondaryAction}`}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.actionButton} ${styles.dangerAction}`}
                  onClick={handleDeleteProject}
                >
                  <Trash2 size={16} />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}