import { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import ProjectModal, { type Project as ProjectModalType } from "../../components/modals/ProjectModal/ProjectModal";
import InvoiceModal, { type CreateInvoice, type Invoice as InvoiceModalType } from "../../components/modals/InvoiceModal/InvoiceModal";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import { 
  Users, 
  FolderOpen, 
  FileText, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Calendar,
  Mail,
  Building,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import type { Client } from "../Clients/Clients";

type Project = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  clientId: number;
  clientName: string;
  clientCompany?: string;
  invoiceCount: number;
  fileCount: number;
  isOverdue: boolean;
  totalInvoiceAmount: number;
};

type InvoiceSummary = {
  id: number;
  invoiceNumber: string;
  title: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: string;
  clientName: string;
  projectTitle: string;
};

type AccountSummary = {
  clientCount: number;
  projectCount: number;
  invoiceCount: number;
  totalRevenue: number;
  pendingRevenue: number;
  hasUnpaidInvoices: boolean;
  hasActiveProjects: boolean;
  canDeleteAccount: boolean;
  totalClients: number;
  activeProjects: number;
  thisMonthRevenue: number;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceModalType | null>(null);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'projects' | 'invoices'>('overview');

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      if (user?.role === "freelancer") {
        // Fetch all data in parallel
        const [summaryRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
          axios.get<AccountSummary>("/user/account-summary"),
          axios.get<Client[]>("/user/clients").catch(() => ({ data: [] })),
          axios.get<Project[]>("/projects").catch(() => ({ data: [] })),
          axios.get<InvoiceSummary[]>("/invoices").catch(() => ({ data: [] }))
        ]);

        setSummary(summaryRes.data);
        
        // Transform user data to include display name
        const transformedClients = clientsRes.data.map(client => ({
          ...client,
          name: client.firstName && client.lastName 
            ? `${client.firstName} ${client.lastName}` 
            : client.username
        }));
        
        setClients(transformedClients.slice(0, 5)); // Show only recent 5
        setProjects(projectsRes.data.slice(0, 5)); // Show only recent 5
        setInvoices(invoicesRes.data.slice(0, 5)); // Show only recent 5
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
      
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleInvoiceSubmit = async (invoiceData: CreateInvoice) => {
    if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
    } else {
      await axios.post("/invoices", invoiceData);
    }
    fetchDashboardData();
    setEditingInvoice(null);
  };

  const openEditInvoice = async (invoiceId: number) => {
    try {
      // fetch the full invoice shape expected by the InvoiceModal
      const res = await axios.get<InvoiceModalType>(`/invoices/${invoiceId}`);
      setEditingInvoice(res.data);
      setShowInvoiceModal(true);
    } catch (err: any) {
      console.error("Failed to fetch invoice for editing:", err);
      // optionally show an error toast
    }
  };

  const handleProjectSubmit = async (projectData: Omit<ProjectModalType, 'id'>) => {
    try {
      if (editingProject) {
        await axios.put(`/projects/${editingProject.id}`, projectData);
      } else {
        await axios.post("/projects", projectData);
      }
      fetchDashboardData();
      setEditingProject(null);
    } catch (err: any) {
      console.error("Failed to save project:", err);
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft': return styles.statusDraft;
      case 'Sent': return styles.statusSent;
      case 'Paid': return styles.statusPaid;
      case 'Overdue': return styles.statusOverdue;
      default: return styles.statusDraft;
    }
  };

  const quickActions = [
    {
      title: "New Project",
      description: "Start a new project",
      icon: <FolderOpen />,
      onClick: () => setShowProjectModal(true),
      show: user?.role === 'freelancer'
    },
    {
      title: "Create Invoice",
      description: "Generate a new invoice",
      icon: <FileText />,
      onClick: () => setShowInvoiceModal(true),
      show: user?.role === 'freelancer'
    },
    {
      title: "View Reports",
      description: "Analyze your performance",
      icon: <BarChart3 />,
      onClick: () => setActiveTab('overview'),
      show: true
    }
  ].filter(action => action.show);

  // Create invoice modal projects array from projects
  const invoiceModalProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    clientName: project.clientName
  }));

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.dashboardContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.dashboardContent}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={fetchDashboardData} className={styles.retryButton}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Navbar variant="dashboard" />
      
      <div className={styles.dashboardContent}>
        {/* Header */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, {user?.username}!
              </h1>
              <p className={styles.welcomeSubtitle}>
                {user?.role === "freelancer" 
                  ? "Manage your clients, projects, and grow your business" 
                  : "Track your projects and collaborate with your freelancer"
                }
              </p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={`${styles.actionButton} ${styles.secondaryAction}`}
                onClick={fetchDashboardData}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {user?.role === "freelancer" && summary && (
          <>
            {/* Stats Overview */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <Users size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>Total Clients</h3>
                    <p className={styles.statValue}>{summary.totalClients}</p>
                    <span className={styles.statSubtext}>Active relationships</span>
                    <div className={`${styles.statTrend} ${styles.trendUp}`}>
                      <TrendingUp size={12} />
                      +12% this month
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <FolderOpen size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>Active Projects</h3>
                    <p className={styles.statValue}>{summary.activeProjects}</p>
                    <span className={styles.statSubtext}>In progress</span>
                    <div className={`${styles.statTrend} ${styles.trendNeutral}`}>
                      <Activity size={12} />
                      Steady progress
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <FileText size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>Total Invoices</h3>
                    <p className={styles.statValue}>{summary.invoiceCount}</p>
                    <span className={styles.statSubtext}>Lifetime invoices</span>
                    <div className={`${styles.statTrend} ${styles.trendUp}`}>
                      <TrendingUp size={12} />
                      +8% this month
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <DollarSign size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>Total Revenue</h3>
                    <p className={styles.statValue}>{formatCurrency(summary.totalRevenue)}</p>
                    <span className={styles.statSubtext}>All time earnings</span>
                    <div className={`${styles.statTrend} ${styles.trendUp}`}>
                      <TrendingUp size={12} />
                      +15% this month
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <Clock size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>Pending Revenue</h3>
                    <p className={styles.statValue}>{formatCurrency(summary.pendingRevenue)}</p>
                    <span className={styles.statSubtext}>Awaiting payment</span>
                    {summary.hasUnpaidInvoices && (
                      <div className={`${styles.statTrend} ${styles.trendDown}`}>
                        ⚠️ Overdue invoices
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <PieChart size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statLabel}>This Month</h3>
                    <p className={styles.statValue}>{formatCurrency(summary.thisMonthRevenue)}</p>
                    <span className={styles.statSubtext}>Monthly revenue</span>
                    {summary.hasActiveProjects && (
                      <div className={`${styles.statTrend} ${styles.trendUp}`}>
                        🚀 Active projects
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <section className={styles.quickActionsSection}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.quickActionsGrid}>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={styles.quickActionCard}
                  >
                    <div className={styles.quickActionIcon}>
                      {action.icon}
                    </div>
                    <div className={styles.quickActionContent}>
                      <h3 className={styles.quickActionTitle}>{action.title}</h3>
                      <p className={styles.quickActionDescription}>{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <BarChart3 size={16} />
                Overview
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'clients' ? styles.active : ''}`}
                onClick={() => setActiveTab('clients')}
              >
                <Users size={16} />
                Recent Clients ({clients.length})
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'projects' ? styles.active : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                <FolderOpen size={16} />
                Active Projects ({projects.length})
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'invoices' ? styles.active : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <FileText size={16} />
                Recent Invoices ({invoices.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'overview' && (
                <div className={styles.tabSection}>
                  <div className={styles.overviewGrid}>
                    <div className={styles.chartSection}>
                      <h3 className={styles.chartTitle}>Revenue Trends</h3>
                      <div className={styles.chartPlaceholder}>
                        <BarChart3 size={48} />
                        <p>📈 Revenue chart integration needed</p>
                        <p>Connect with Chart.js or Recharts for data visualization</p>
                      </div>
                    </div>
                    
                    <div className={styles.recentActivity}>
                      <h3 className={styles.activityTitle}>Recent Activity</h3>
                      <div className={styles.activityList}>
                        <div className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            <FileText size={14} />
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>Invoice INV-2024-001 sent to Client ABC</p>
                            <span className={styles.activityTime}>2 hours ago</span>
                          </div>
                        </div>
                        <div className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            <Users size={14} />
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>New client relationship established</p>
                            <span className={styles.activityTime}>1 day ago</span>
                          </div>
                        </div>
                        <div className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            <DollarSign size={14} />
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>Payment received for Invoice INV-2024-002</p>
                            <span className={styles.activityTime}>3 days ago</span>
                          </div>
                        </div>
                        <div className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            <FolderOpen size={14} />
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>Project "Website Redesign" completed</p>
                            <span className={styles.activityTime}>1 week ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'clients' && (
                <div className={styles.tabSection}>
                  <div className={styles.tabSectionHeader}>
                    <h2 className={styles.tabSectionTitle}>Recent Clients</h2>
                    <button onClick={() => navigate('/clients')} className={styles.viewAllButton}>
                      View All Clients →
                    </button>
                  </div>
                  
                  <div className={styles.cardList}>
                    {clients.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <Users size={64} />
                        </div>
                        <h3 className={styles.emptyTitle}>No clients yet</h3>
                        <p className={styles.emptyDescription}>
                          As you work with clients and create projects, they'll appear here automatically. 
                          Start by creating your first project or sending an invoice to begin building your client relationships.
                        </p>
                        <button 
                          className={styles.emptyAction}
                          onClick={() => setShowProjectModal(true)}
                        >
                          <Plus size={16} />
                          Create Your First Project
                        </button>
                      </div>
                    ) : (
                      clients.map(client => (
                        <div key={client.id} className={styles.itemCard}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{client.name}</h3>
                            <div className={styles.cardActions}>
                              <button 
                                className={styles.iconButton} 
                                title="View Client Details"
                                onClick={() => navigate('/clients')}
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className={styles.cardDetails}>
                            {client.company && (
                              <div className={styles.detailItem}>
                                <Building size={14} />
                                <span>{client.company}</span>
                              </div>
                            )}
                            <div className={styles.detailItem}>
                              <Mail size={14} />
                              <span>{client.email}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className={styles.tabSection}>
                  <div className={styles.tabSectionHeader}>
                    <h2 className={styles.tabSectionTitle}>Active Projects</h2>
                    <button className={styles.viewAllButton}>
                      View All Projects →
                    </button>
                  </div>
                  
                  <div className={styles.cardList}>
                    {projects.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <FolderOpen size={64} />
                        </div>
                        <h3 className={styles.emptyTitle}>No projects yet</h3>
                        <p className={styles.emptyDescription}>
                          Create your first project to start organizing your work. 
                          Projects help you track progress, manage files, and generate invoices.
                        </p>
                        <button 
                          className={styles.emptyAction}
                          onClick={() => setShowProjectModal(true)}
                        >
                          <Plus size={16} />
                          Create Your First Project
                        </button>
                      </div>
                    ) : (
                      projects.map(project => {
                        const daysLeft = getDaysUntilDeadline(project.deadline);
                        return (
                          <div key={project.id} className={styles.itemCard}>
                            <div className={styles.cardHeader}>
                              <h3 className={styles.cardTitle}>{project.title}</h3>
                              <div className={styles.cardMeta}>
                                {project.isOverdue ? (
                                  <span className={`${styles.statusBadge} ${styles.statusOverdue}`}>
                                    Overdue
                                  </span>
                                ) : daysLeft <= 7 ? (
                                  <span className={`${styles.statusBadge} ${styles.statusSent}`}>
                                    {daysLeft} days left
                                  </span>
                                ) : (
                                  <span className={`${styles.statusBadge} ${styles.statusPaid}`}>
                                    {daysLeft} days left
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className={styles.cardDescription}>{project.description}</p>
                            
                            <div className={styles.cardDetails}>
                              <div className={styles.detailItem}>
                                <Users size={14} />
                                <span>{project.clientName}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <Calendar size={14} />
                                <span>{formatDate(project.deadline)}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <FileText size={14} />
                                <span>{project.invoiceCount} invoices</span>
                              </div>
                              <div className={styles.detailItem}>
                                <DollarSign size={14} />
                                <span>{formatCurrency(project.totalInvoiceAmount)}</span>
                              </div>
                            </div>
                            
                            <div className={styles.cardActions}>
                              <button 
                                className={styles.iconButton}
                                onClick={() => navigate('/projects')}
                                title="View Project">
                                <Eye size={16} />
                              </button>
                              <button 
                                className={styles.iconButton} 
                                title="Edit Project"
                                onClick={() => {
                                  setEditingProject(project);
                                  setShowProjectModal(true);
                                }}
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className={styles.tabSection}>
                  <div className={styles.tabSectionHeader}>
                    <h2 className={styles.tabSectionTitle}>Recent Invoices</h2>
                    <button 
                      className={styles.viewAllButton}
                      onClick={() => navigate('/invoices')}
                    >
                      View All Invoices →
                    </button>
                  </div>
                  
                  <div className={styles.cardList}>
                    {invoices.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <FileText size={64} />
                        </div>
                        <h3 className={styles.emptyTitle}>No invoices yet</h3>
                        <p className={styles.emptyDescription}>
                          Create your first invoice to start getting paid for your work. 
                          Our invoice system makes it easy to track payments and manage your finances.
                        </p>
                        <button 
                          className={styles.emptyAction}
                          onClick={() => setShowInvoiceModal(true)}
                        >
                          <Plus size={16} />
                          Create Your First Invoice
                        </button>
                      </div>
                    ) : (
                      invoices.map(invoice => (
                        <div key={invoice.id} className={styles.itemCard}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{invoice.invoiceNumber}</h3>
                            <div className={styles.cardMeta}>
                              <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                          
                          <p className={styles.cardDescription}>{invoice.title}</p>
                          
                          <div className={styles.cardDetails}>
                            <div className={styles.detailItem}>
                              <DollarSign size={14} />
                              <span>{formatCurrency(invoice.amount)}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <Calendar size={14} />
                              <span>Due: {formatDate(invoice.dueDate)}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <Users size={14} />
                              <span>{invoice.clientName}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <FolderOpen size={14} />
                              <span>{invoice.projectTitle}</span>
                            </div>
                          </div>
                          
                          <div className={styles.cardActions}>
                            <button 
                              className={styles.iconButton} 
                              title="View Invoice"
                              onClick={() => navigate('/invoices')}
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className={styles.iconButton} 
                              title="Edit Invoice"
                              onClick={() => openEditInvoice(invoice.id)}
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Client Dashboard */}
        {user?.role === "client" && (
          <div className={styles.tabContent}>
            <div className={styles.tabSection}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FolderOpen size={64} />
                </div>
                <h3 className={styles.emptyTitle}>Welcome to your client portal</h3>
                <p className={styles.emptyDescription}>
                  Your freelancer will create projects for you to collaborate on. 
                  Once projects are created, you'll be able to view files, invoices, 
                  and track project progress here.
                </p>
                <div className={styles.cardDetails} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                  <div className={styles.detailItem}>
                    <Mail size={16} />
                    <span>Check your email for project invitations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
        }}
        onSubmit={handleInvoiceSubmit}
        projects={invoiceModalProjects}
        invoice={editingInvoice}
        mode={editingInvoice ? 'edit' : 'add'}
      />
    </div>
  );
}