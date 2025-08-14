import { useState, useEffect } from "react";
import styles from "./Clients.module.css";
import tableStyles from "../../components/Table/Table.module.css";
import { useAuth } from "../../context/AuthContext";
import ClientModal, { type Client as ClientModalType } from "../../components/modals/ClientModal/ClientModal";
import Navbar from "../../components/Navbar/Navbar";
import Table, { type Column } from "../../components/Table/Table";
import {
  Users,
  Plus,
  Search,
  Eye,
  Trash2,
  Mail,
  Building,
  FolderOpen,
  FileText,
  DollarSign,
  RefreshCw,
  Download,
  BarChart3,
  Edit,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";

export type Client = {
  id: number;
  name: string;
  email: string;
  company: string;
};

type ClientStats = {
  totalClients: number;
  clientsWithProjects: number;
  clientsWithUnpaidInvoices: number;
  topClientsByRevenue: Array<{
    clientName: string;
    totalRevenue: number;
  }>;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Invoice viewing states
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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
      const response = await axios.get<Client[]>("/clients");
      setClients(response.data);
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
      const response = await axios.get<ClientStats>("/clients/stats");
      setClientStats(response.data);
    } catch (err: any) {
      console.error("Fetch client stats error:", err);
    }
  };

  // Fetch invoices for a specific client
  const fetchClientInvoices = async (clientId: number) => {
    try {
      setLoadingInvoices(true);
      const response = await axios.get<Invoice[]>(`/clients/${clientId}/invoices`);
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

  const handleSort = (field: 'name' | 'company' | 'email', order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleClientSubmit = async (clientData: Omit<ClientModalType, 'id'>) => {
    try {
      if (editingClient) {
        // Edit existing client
        const response = await axios.put(`/clients/${editingClient.id}`, clientData);
        setClients(clients.map(c => c.id === editingClient.id ? response.data : c));
      } else {
        // Add new client
        const response = await axios.post("/clients", clientData);
        setClients([...clients, response.data]);
      }
      setShowClientModal(false);
      setEditingClient(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save client");
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await axios.delete(`/clients/${clientToDelete.id}`);
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete client");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInvoiceStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return styles.completed;
      case 'overdue': return styles.overdue;
      case 'sent': return styles.active;
      default: return styles.pending;
    }
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
          <div className={tableStyles.clientAvatar} style={{borderRadius: '50%' /* Override default 10px from Table.module.css */}}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className={tableStyles.clientDetails}>
            <span className={tableStyles.clientName}>{client.name}</span>
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
      render: () => (
        <div className={tableStyles.cellWithIcon}>
          <FolderOpen size={14} />
          <span>Loading...</span> {/* Placeholder, would be actual data */}
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      gridColumnWidth: '120px',
      render: () => (
        <div className={tableStyles.cellWithIcon}>
          <DollarSign size={14} />
          <span>Loading...</span> {/* Placeholder, would be actual data */}
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
            onClick={() => navigate('/projects')}
            className={tableStyles.dropdownItem}
          >
            <Eye size={14} />
            View Projects
          </button>
          <button
            className={tableStyles.dropdownItem}
            onClick={() => {
              setEditingClient(client);
              setShowClientModal(true);
            }}
          >
            <Edit size={14} />
            Edit Client
          </button>
          <button 
            className={tableStyles.dropdownItem}
            onClick={() => handleViewInvoices(client)}
          >
            <FileText size={14} />
            View Invoices
          </button>
          <button className={tableStyles.dropdownItem}>
            <Mail size={14} />
            Send Email
          </button>
          <hr className={tableStyles.dropdownDivider} />
          <button
            className={`${tableStyles.dropdownItem} ${tableStyles.danger}`}
            onClick={() => {
              setClientToDelete(client);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={14} />
            Delete Client
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
          : "Start building your client base by adding your first client. You can manage their projects, invoices, and communications all in one place."
        }
      </p>
      {!searchTerm && (
        <button
          className={tableStyles.emptyAction}
          onClick={() => setShowClientModal(true)}
        >
          <Plus size={16} />
          Add Your First Client
        </button>
      )}
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
              <button
                className={`${styles.actionButton} ${styles.primaryAction}`}
                onClick={() => setShowClientModal(true)}
              >
                <Plus size={16} />
                Add Client
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
                <button className={styles.bulkButton}>
                  <Trash2 size={16} />
                  Delete
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

        {/* Client Modal */}
        <ClientModal
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setEditingClient(null);
          }}
          onSubmit={handleClientSubmit}
          client={editingClient}
          mode={editingClient ? 'edit' : 'add'}
        />

        {/* Client Invoices Modal */}
        {showInvoicesModal && selectedClient && (
          <div className={styles.modalOverlay} onClick={() => setShowInvoicesModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <header className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <FileText size={24} />
                  Invoices for {selectedClient.name}
                </h2>
              </header>

              <div className={styles.modalContent}>
                {loadingInvoices ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading invoices...</p>
                  </div>
                ) : clientInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <FileText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                    <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No invoices yet</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                      This client doesn't have any invoices. Create a project and invoice to start billing.
                    </p>
                  </div>
                ) : (
                  <div className={styles.invoicesList}>
                    {clientInvoices.map((invoice) => (
                      <div key={invoice.id} className={styles.invoiceCard}>
                        <div className={styles.invoiceHeader}>
                          <div className={styles.invoiceInfo}>
                            <h4 className={styles.invoiceTitle}>
                              #{invoice.invoiceNumber}
                            </h4>
                            <p className={styles.invoiceDescription}>
                              {invoice.title || 'No title'}
                            </p>
                            <p className={styles.invoiceProject}>
                              Project: {invoice.projectTitle}
                            </p>
                          </div>
                          <div className={styles.invoiceAmount}>
                            {formatCurrency(invoice.amount)}
                          </div>
                        </div>
                        
                        <div className={styles.invoiceDetails}>
                          <div className={styles.invoiceDate}>
                            <Calendar size={14} />
                            <span>Issue: {formatDate(invoice.issueDate)}</span>
                          </div>
                          <div className={styles.invoiceDate}>
                            <Clock size={14} />
                            <span>Due: {formatDate(invoice.dueDate)}</span>
                          </div>
                          <div className={styles.invoiceStatus}>
                            <span className={`${tableStyles.statusBadge} ${getInvoiceStatusBadgeClass(invoice.status)}`}>
                              {invoice.status === 'Paid' && <CheckCircle size={12} />}
                              {invoice.status === 'Overdue' && <AlertCircle size={12} />}
                              {invoice.status === 'Sent' && <Clock size={12} />}
                              {invoice.status === 'Draft' && <FileText size={12} />}
                              {invoice.status}
                            </span>
                          </div>
                        </div>

                        {invoice.description && (
                          <div className={styles.invoiceDescription}>
                            <p>{invoice.description}</p>
                          </div>
                        )}

                        {invoice.items.length > 0 && (
                          <div className={styles.invoiceItems}>
                            <h5>Items:</h5>
                            <ul>
                              {invoice.items.slice(0, 3).map((item) => (
                                <li key={item.id}>
                                  {item.description} - {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.total)}
                                </li>
                              ))}
                              {invoice.items.length > 3 && (
                                <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                  ... and {invoice.items.length - 3} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {invoice.payments.length > 0 && (
                          <div className={styles.invoicePayments}>
                            <h5>Recent Payments:</h5>
                            <ul>
                              {invoice.payments.slice(0, 2).map((payment) => (
                                <li key={payment.id}>
                                  {formatCurrency(payment.amount)} on {formatDate(payment.paymentDate)} ({payment.method})
                                </li>
                              ))}
                              {invoice.payments.length > 2 && (
                                <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                  ... and {invoice.payments.length - 2} more payments
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {(invoice.sentAt || invoice.paidAt) && (
                          <div className={styles.invoiceDates}>
                            {invoice.sentAt && (
                              <div className={styles.invoiceDate}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                  Sent: {formatDate(invoice.sentAt)}
                                </span>
                              </div>
                            )}
                            {invoice.paidAt && (
                              <div className={styles.invoiceDate}>
                                <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                                  Paid: {formatDate(invoice.paidAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
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
        {showDeleteModal && clientToDelete && (
          <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <header className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <Trash2 size={24} />
                  Delete Client
                </h2>
              </header>

              <div className={styles.modalContent}>
                <p className={styles.confirmationText}>
                  Are you sure you want to delete <strong>{clientToDelete.name}</strong>?
                </p>
                <p className={styles.warningText}>
                  This action cannot be undone. All associated projects and data will also be removed.
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
                  onClick={handleDeleteClient}
                >
                  <Trash2 size={16} />
                  Delete Client
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