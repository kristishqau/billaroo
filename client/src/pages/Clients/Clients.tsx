import { useState, useEffect } from "react";
import styles from "./Clients.module.css";
import tableStyles from "../../components/Table/Table.module.css";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import InvoiceViewModal, { type ViewableEntity } from "../../components/modals/InvoiceModal/InvoiceViewModal";
import InvoiceModal, { type CreateInvoice, type Invoice as InvoiceModalType } from "../../components/modals/InvoiceModal/InvoiceModal";
import Table, { type Column } from "../../components/Table/Table";
import {
  Users,
  Plus,
  Search,
  Eye,
  Mail,
  Building,
  FolderOpen,
  FileText,
  RefreshCw,
  Download,
  BarChart3,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import ClientProjectsModal from "../../components/modals/ClientModal/ClientProjectsModal";

export type Client = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  name: string;
  projectCount: number;
  invoiceCount: number;
  totalRevenue: number;
  paidInvoiceAmount?: number;
  lastActivity?: string;
  isActive?: boolean;
};

type ClientStats = {
  totalClients: number;
  clientsWithProjects: number;
  clientsWithUnpaidInvoices: number;
  activeClientsThisMonth: number;
  newClientsThisMonth: number;
  topClientsByRevenue: Array<{
    clientName: string;
    totalRevenue: number;
  }>;
};

// Project type for invoice modal
type ProjectForInvoiceModal = {
  id: number;
  title: string;
  clientName: string;
  clientEmail?: string;
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

export default function Clients() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  // State for projects modal
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Invoice viewing states
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Invoice creation states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceModalType | null>(null);
  const [projectsForInvoiceModal, setProjectsForInvoiceModal] = useState<ProjectForInvoiceModal[]>([]);

  useEffect(() => {
    if (user?.role === "freelancer") {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    // Only fetch stats after clients are loaded
    if (clients.length > 0 || !loading) {
      fetchClientStats();
    }
  }, [clients, loading]);

  useEffect(() => {
    filterAndSortClients();
  }, [clients, searchTerm, sortBy, sortOrder]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
        axios.get("/User/clients"),
        axios.get("/projects"),
        axios.get("/invoices"),
      ]);

      const enrichedClients = clientsRes.data.map((client: any) => {
        const clientProjects = projectsRes.data.filter((p: any) => p.clientId === client.id);
        const clientInvoices = invoicesRes.data.filter((inv: any) => inv.clientId === client.id);

        const projectCount = clientProjects.length;
        const invoiceCount = clientInvoices.length;
        const totalRevenue = clientInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

        return { 
          ...client,
          name: client.firstName && client.lastName 
            ? `${client.firstName} ${client.lastName}` 
            : client.username,
          projectCount,
          invoiceCount,
          totalRevenue
        };
      });

      setClients(enrichedClients);
      // Fetch all projects to be used in the InvoiceModal
      setProjectsForInvoiceModal(projectsRes.data.map((project: any) => ({
        id: project.id,
        title: project.title,
        clientName: project.clientName,
        clientEmail: project.clientEmail
      })));

    } catch (err: any) {
      console.error("Fetch clients error:", err);
      setError("Failed to load clients");
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientStats = async () => {
    try {
      const response = await axios.get<ClientStats>("/User/clients/stats");
      setClientStats(response.data);
    } catch (err: any) {
      console.error("Fetch client stats error:", err);
    }
  };

  // Fetch invoices for a specific client
  const fetchClientInvoices = async (clientId: number) => {
    try {
      setLoadingInvoices(true);
      const response = await axios.get<Invoice[]>(`/User/clients/${clientId}/invoices`);
      setClientInvoices(response.data);
    } catch (err: any) {
      console.error("Fetch client invoices error:", err);
      setError("Failed to load client invoices");
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle viewing invoices for a client
  const handleViewInvoices = async (client: Client) => {
    setSelectedClient(client);
    setShowInvoicesModal(true);
    await fetchClientInvoices(client.id);
  };

  // Handler to open the projects modal
  const handleViewProjects = (client: Client) => {
    setSelectedClient(client);
    setShowProjectsModal(true);
  };

  const filterAndSortClients = () => {
    let filtered = clients;

    // Filter by search term
    if (searchTerm) {
      filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort clients
    filtered.sort((a, b) => {
      let aValue = "";
      let bValue = "";

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'company':
          aValue = (a.company || "").toLowerCase();
          bValue = (b.company || "").toLowerCase();
          break;
        case 'email':
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredClients(filtered);
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field as 'name' | 'company' | 'email');
    setSortOrder(order);
  };

  // Function to open the create invoice modal for a specific client
  const handleOpenCreateInvoice = (entity: ViewableEntity) => {
    const client = entity as Client;
    setSelectedClient(client);
    setEditingInvoice(null); // Ensure no existing invoice is being edited
    setShowInvoiceModal(true);
  };

  // Handle invoice creation/update
  const handleInvoiceSubmit = async (invoiceData: CreateInvoice) => {
    try {
      if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
      } else {
        await axios.post("/invoices", invoiceData);
      }
      
      // Refresh clients to update invoice counts and totals
      await fetchClients();
      setShowInvoiceModal(false);
      setEditingInvoice(null);
      setSelectedClient(null); // Clear selected client after invoice creation
    } catch (err: any) {
      console.error("Invoice submission error:", err);
      throw err; // Re-throw to let InvoiceModal handle the error display
    }
  };

  const handleSelectClient = (clientId: number | string) => {
    setSelectedClients(prev =>
      prev.includes(clientId as number)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId as number]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Define columns for the Clients Table
  const clientColumns: Column<Client>[] = [
    {
      key: 'checkbox',
      header: '',
      gridColumnWidth: '60px',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      gridColumnWidth: '2fr',
      render: (client) => (
        <div className={tableStyles.clientInfoCell}>
          <div className={tableStyles.clientAvatar} style={{borderRadius: '50%'}}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className={tableStyles.clientDetails}>
            <span className={tableStyles.clientName}>{client.name}</span>
            <span className={tableStyles.clientRole}>{client.username}</span>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      gridColumnWidth: '2fr',
      render: (client) => (
        <div className={tableStyles.cellWithIcon}>
          <Mail size={14} />
          <span>{client.email || "No email"}</span>
        </div>
      )
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      gridColumnWidth: '1.5fr',
      render: (client) => (
        <div className={tableStyles.cellWithIcon}>
          <Building size={14} />
          <span>{client.company || "No company"}</span>
        </div>
      )
    },
    {
      key: 'projects',
      header: 'Projects',
      gridColumnWidth: '120px',
      render: (client) => (
        <div className={tableStyles.cellWithIcon}>
          <FolderOpen size={14} />
          <span>{client.projectCount ?? 0}</span>
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      gridColumnWidth: '120px',
      render: (client) => (
        <div className={tableStyles.cellWithIcon}>
          <DollarSign size={14} />
          <span>{formatCurrency(client.totalRevenue ?? 0)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      gridColumnWidth: '50px',
      render: (client) => (
        <>
          <button
            onClick={() => handleViewProjects(client)}
            className={tableStyles.dropdownItem}
          >
            <Eye size={14} />
            View Projects ({client.projectCount})
          </button>
          <button 
            className={tableStyles.dropdownItem}
            onClick={() => handleViewInvoices(client)}
          >
            <FileText size={14} />
            View Invoices ({client.invoiceCount})
          </button>
          <button
            className={tableStyles.dropdownItem}
            onClick={() => handleOpenCreateInvoice(client)}
          >
            <Plus size={14} />
            Create Invoice
          </button>
        </>
      )
    }
  ];

  const emptyClientsState = (
    <>
      <div className={tableStyles.emptyIcon}>
        <Users size={64} />
      </div>
      <h3 className={tableStyles.emptyTitle}>
        {searchTerm ? "No clients found" : "No clients yet"}
      </h3>
      <p className={tableStyles.emptyDescription}>
        {searchTerm
          ? "Try adjusting your search terms to find the client you're looking for."
          : "Clients will appear here automatically as you work with them. Create projects and send invoices to start building your client relationships."
        }
      </p>
    </>
  );

  if (user?.role !== "freelancer") {
    return (
      <div className={styles.clientsContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.clientsContent}>
          <div className={tableStyles.errorContainer}>
            <h2>Access Denied</h2>
            <p>Only freelancers can manage clients.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.clientsContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.clientsContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.clientsContainer}>
      <Navbar variant="dashboard" />

      <div className={styles.clientsContent}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>
                <Users size={32} />
                Clients
              </h1>
              <p className={styles.pageSubtitle}>
                Manage your client relationships and business partnerships
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={`${styles.actionButton} ${styles.secondaryAction}`}
                onClick={fetchClients}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        {clientStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Total Clients</h3>
                <p className={styles.statValue}>{clientStats.totalClients}</p>
                <span className={styles.statSubtext}>Active relationships</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FolderOpen size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>With Projects</h3>
                <p className={styles.statValue}>{clientStats.clientsWithProjects}</p>
                <span className={styles.statSubtext}>Active collaborations</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FileText size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Unpaid Invoices</h3>
                <p className={styles.statValue}>{clientStats.clientsWithUnpaidInvoices}</p>
                <span className={styles.statSubtext}>Need attention</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <BarChart3 size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Active This Month</h3>
                <p className={styles.statValue}>{clientStats.activeClientsThisMonth}</p>
                <span className={styles.statSubtext}>Monthly engagement</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Plus size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>New This Month</h3>
                <p className={styles.statValue}>{clientStats.newClientsThisMonth}</p>
                <span className={styles.statSubtext}>Growth rate</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <DollarSign size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statLabel}>Top Performer</h3>
                <p className={styles.statValue}>
                  {clientStats.topClientsByRevenue[0]?.clientName || "N/A"}
                </p>
                <span className={styles.statSubtext}>
                  {clientStats.topClientsByRevenue[0]
                    ? formatCurrency(clientStats.topClientsByRevenue[0].totalRevenue)
                    : "No revenue yet"
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notice about automatic client management */}
        <div className={styles.infoNotice}>
          <AlertCircle size={20} />
          <div className={styles.noticeContent}>
            <strong>Automatic Client Management:</strong> Clients are automatically added when you create projects or send invoices. 
            You can view their details, projects, and invoices here.
          </div>
        </div>

        {/* Search and Filters */}
        <div className={styles.controlsBar}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.controlsActions}>
            {selectedClients.length > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectedCount}>
                  {selectedClients.length} selected
                </span>
                <button className={styles.bulkButton}>
                  <Download size={16} />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clients Table */}
        <Table
          data={filteredClients}
          columns={clientColumns}
          onRowSelect={handleSelectClient}
          onSelectAll={handleSelectAll}
          selectedIds={selectedClients}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          emptyStateContent={emptyClientsState}
          getRowId={(client) => client.id}
        />

        {/* Invoice View Modal */}
        <InvoiceViewModal
          isOpen={showInvoicesModal}
          onClose={() => {
            setShowInvoicesModal(false);
            setSelectedClient(null);
            setClientInvoices([]);
          }}
          entity={selectedClient}
          invoices={clientInvoices}
          loading={loadingInvoices}
          onOpenCreateInvoice={handleOpenCreateInvoice}
          titlePrefix="Invoices for"
          emptyStateMessage="This client doesn't have any invoices. Create an invoice to start billing."
        />

        {/* Invoice Creation Modal */}
        {showInvoiceModal && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => {
              setShowInvoiceModal(false);
              setEditingInvoice(null);
              setSelectedClient(null); // Clear selected client on close
            }}
            onSubmit={handleInvoiceSubmit}
            projects={projectsForInvoiceModal.filter(p => selectedClient ? p.clientName === selectedClient.name : true)} // Filter projects by selected client name
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
            initialClientId={selectedClient?.id || undefined}
          />
        )}

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
      </div>

      {/* Projects Modal */}
      {showProjectsModal && selectedClient && (
        <ClientProjectsModal
          isOpen={showProjectsModal}
          onClose={() => {
            setShowProjectsModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          onViewProject={(projectId) => {
            navigate(`/projects/${projectId}`);
          }}
        />
      )}
    </div>
  );
}