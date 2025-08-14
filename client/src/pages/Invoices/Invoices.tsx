import { useState, useEffect, useMemo } from "react";
import styles from "./Invoices.module.css";
import Navbar from "../../components/Navbar/Navbar";
import axios from "../../api/axios";
import InvoiceModal, { type CreateInvoice, type Project as ProjectModalType } from "../../components/modals/InvoiceModal/InvoiceModal";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  Send,
  Edit,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  MoreVertical
} from 'lucide-react';

// Types
interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  projectId: number;
  projectTitle: string;
  clientId: number;
  clientName: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  transactionId: string;
  notes?: string;
  createdAt: string;
}

interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
}

type SortField = 'invoiceNumber' | 'title' | 'amount' | 'dueDate' | 'status' | 'clientName';
type SortDirection = 'asc' | 'desc';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [projects, setProjects] = useState<ProjectModalType[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendFormData, setSendFormData] = useState({
    toEmail: '',
    subject: '',
    message: ''
  });
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchInvoices();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
        const response = await axios.get("/projects");
        // Assuming the API returns projects with client information
        setProjects(response.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          clientName: p.client?.name || p.clientName || 'Unknown Client'
        })));
    } catch (err) {
        console.error("Failed to fetch projects:", err);
    }
  };

  const handleSendInvoice = async (invoiceData: { toEmail: string; subject: string; message: string }) => {
    if (!invoiceToSend || isSending) return;
    
    setIsSending(true);
    setSendError('');
    
    try {
      await axios.post(`/invoices/${invoiceToSend.id}/send`, invoiceData);
      fetchInvoices(); // Refresh the invoices list
      
      // Close modal and reset state after successful send
      setShowSendModal(false);
      setInvoiceToSend(null);
      setSendFormData({ toEmail: '', subject: '', message: '' });
      
      // You might want to add a success toast/notification here
      console.log('Invoice sent successfully!');
    } catch (err: any) {
      console.error("Failed to send invoice:", err);
      setSendError(err.response?.data?.message || 'Failed to send invoice. Please try again.');
      // Don't close modal on error so user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleInvoiceSubmit = async (invoiceData: CreateInvoice) => {
    if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
    } else {
        await axios.post("/invoices", invoiceData);
    }
    fetchInvoices();
    setEditingInvoice(null);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.get<Invoice[]>("/invoices");
      setInvoices(response.data);
      
      // Calculate stats
      const totalInvoices = response.data.length;
      const totalAmount = response.data.reduce((sum, inv) => sum + inv.amount, 0);
      const paidAmount = response.data.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
      const pendingAmount = response.data.filter(inv => inv.status === 'Sent').reduce((sum, inv) => sum + inv.amount, 0);
      const overdueAmount = response.data.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
      
      setStats({
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        draftCount: response.data.filter(inv => inv.status === 'Draft').length,
        sentCount: response.data.filter(inv => inv.status === 'Sent').length,
        paidCount: response.data.filter(inv => inv.status === 'Paid').length,
        overdueCount: response.data.filter(inv => inv.status === 'Overdue').length,
      });
    } catch (err: any) {
      console.error("Failed to fetch invoices:", err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    const filtered = invoices.filter(invoice => {
      const matchesSearch = !searchQuery || 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const invoiceDate = new Date(invoice.issueDate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "today":
            matchesDate = daysDiff === 0;
            break;
          case "week":
            matchesDate = daysDiff <= 7;
            break;
          case "month":
            matchesDate = daysDiff <= 30;
            break;
          case "quarter":
            matchesDate = daysDiff <= 90;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'dueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [invoices, searchQuery, statusFilter, dateFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusUpdate = async (invoiceId: number, newStatus: string) => {
    try {
      await axios.put(`/invoices/${invoiceId}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchInvoices();
      setSelectedInvoice(null);

    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await axios.delete(`/invoices/${invoiceToDelete.id}`);
      fetchInvoices();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    } finally {
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDownloadPDF = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const response = await axios.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download PDF:", err);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'Paid' && new Date(dueDate) < new Date();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className={styles.invoicesContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.invoicesContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.invoicesContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.invoicesContent}>
          <div className={styles.loadingContainer}>
            <AlertCircle size={48} color="var(--danger)" />
            <p className={styles.loadingText}>{error}</p>
            <button onClick={fetchInvoices} className={styles.primaryButton}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.invoicesContainer}>
      <Navbar variant="dashboard" />
      
      <div className={styles.invoicesContent}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Invoices</h1>
              <p className={styles.pageSubtitle}>
                Manage and track all your invoices in one place
              </p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.secondaryButton}
                onClick={fetchInvoices}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button 
                className={styles.primaryButton}
                onClick={() => setShowInvoiceModal(true)}
                >
                <Plus size={16} />
                Create Invoice
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <div className={`${styles.statIcon} ${styles.draft}`}>
                  <FileText size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statLabel}>Total Invoices</h3>
                  <p className={styles.statValue}>{stats.totalInvoices}</p>
                  <span className={styles.statSubtext}>All time</span>
                </div>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <div className={`${styles.statIcon} ${styles.paid}`}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statLabel}>Paid</h3>
                  <p className={styles.statValue}>{formatCurrency(stats.paidAmount)}</p>
                  <span className={styles.statSubtext}>{stats.paidCount} invoices</span>
                </div>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <div className={`${styles.statIcon} ${styles.sent}`}>
                  <Clock size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statLabel}>Pending</h3>
                  <p className={styles.statValue}>{formatCurrency(stats.pendingAmount)}</p>
                  <span className={styles.statSubtext}>{stats.sentCount} invoices</span>
                </div>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <div className={`${styles.statIcon} ${styles.overdue}`}>
                  <AlertCircle size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statLabel}>Overdue</h3>
                  <p className={styles.statValue}>{formatCurrency(stats.overdueAmount)}</p>
                  <span className={styles.statSubtext}>{stats.overdueCount} invoices</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersContent}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date Range</label>
              <select
                className={styles.filterSelect}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>
            
            {(searchQuery || statusFilter !== "all" || dateFilter !== "all") && (
              <button onClick={clearFilters} className={styles.clearFilters}>
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              {filteredAndSortedInvoices.length} Invoice{filteredAndSortedInvoices.length !== 1 ? 's' : ''}
            </h2>
            <div className={styles.tableActions}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  className={styles.searchInput}
                  style={{ paddingLeft: '40px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {paginatedInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileText size={64} />
              </div>
              <h3 className={styles.emptyTitle}>
                {invoices.length === 0 ? "No invoices yet" : "No invoices match your filters"}
              </h3>
              <p className={styles.emptyDescription}>
                {invoices.length === 0 
                  ? "Create your first invoice to start getting paid for your work."
                  : "Try adjusting your search criteria or clearing the filters."
                }
              </p>
              {invoices.length === 0 && (
                <button 
                    className={styles.emptyAction}
                    onClick={() => setShowInvoiceModal(true)}
                    >
                    <Plus size={16} />
                    Create Your First Invoice
                </button>
              )}
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr className={styles.tableHeadRow}>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('invoiceNumber')}
                    >
                      Invoice #
                      {sortField === 'invoiceNumber' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('title')}
                    >
                      Title & Description
                      {sortField === 'title' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('clientName')}
                    >
                      Client
                      {sortField === 'clientName' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortField === 'amount' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date
                      {sortField === 'dueDate' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`${styles.tableHeadCell} ${styles.sortable}`}
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' && (
                        <span className={`${styles.sortIcon} ${styles.active}`}>
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </th>
                    <th className={styles.tableHeadCell}></th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {paginatedInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className={styles.tableBodyRow}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <td className={styles.tableBodyCell}>
                        <span className={styles.invoiceNumber}>
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <div>
                          <h4 className={styles.invoiceTitle}>{invoice.title}</h4>
                          <p className={styles.invoiceDescription}>{invoice.description}</p>
                        </div>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <div>
                          <div>{invoice.clientName}</div>
                          <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>
                            {invoice.projectTitle}
                          </div>
                        </div>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <span className={styles.amount}>
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <span className={`${styles.dateCell} ${
                          isOverdue(invoice.dueDate, invoice.status) ? styles.overdueDate : ''
                        }`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <span className={`${styles.statusBadge} ${styles.status} ${styles[(invoice.status || "").toString().toLowerCase()]}`}>
                        <span className={styles.statusDot}></span>
                        {invoice.status}
                        </span>
                      </td>
                      <td className={styles.tableBodyCell}>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === invoice.id ? null : invoice.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openDropdownId === invoice.id && (
                            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSelectedInvoice(invoice)}>
                                <Eye size={14} /> View Details
                              </button>
                              <button onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}>
                                <Download size={14} /> Download PDF
                              </button>
                              {invoice.status === 'Draft' && (
                                <>
                                  <button onClick={() => { setEditingInvoice(invoice); setShowInvoiceModal(true); }}>
                                    <Edit size={14} /> Edit Invoice
                                  </button>
                                  <button className={styles.danger} onClick={() => handleDeleteClick(invoice)}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                  <button onClick={() => {
                                      setInvoiceToSend(invoice);
                                      setSendFormData({
                                        toEmail: '', // You might want to pre-populate with client email if available
                                        subject: `Invoice #${invoice.invoiceNumber}`,
                                        message: `Dear ${invoice.clientName},\n\nPlease find your invoice attached.\n\nThank you for your business.`
                                      });
                                      setShowSendModal(true);
                                      setOpenDropdownId(null);
                                    }}>
                                      <Send size={14} /> Send Invoice
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedInvoices.length)} of {filteredAndSortedInvoices.length} invoices
                  </div>
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationButton}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      className={styles.paginationButton}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Invoice {selectedInvoice.invoiceNumber}
              </h2>
              <button
                className={styles.modalCloseInvoiceButton}
                onClick={() => setSelectedInvoice(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>Invoice Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <div><strong>Title:</strong> {selectedInvoice.title}</div>
                    <div><strong>Description:</strong> {selectedInvoice.description}</div>
                    <div><strong>Amount:</strong> {formatCurrency(selectedInvoice.amount)}</div>
                    <div><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</div>
                    <div><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</div>
                    <div>
                      <strong>Status:</strong> 
                      <span className={`${styles.statusBadge} ${styles.status} ${styles[(selectedInvoice.status || "").toString().toLowerCase()]}`}>
                      <span className={styles.statusDot}></span>
                       {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>Client & Project</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <div><strong>Client:</strong> {selectedInvoice.clientName}</div>
                    <div><strong>Project:</strong> {selectedInvoice.projectTitle}</div>
                    <div><strong>Created:</strong> {formatDate(selectedInvoice.createdAt)}</div>
                     {selectedInvoice.sentAt && (
                      <div><strong>Sent:</strong> {formatDate(selectedInvoice.sentAt)}</div>
                    )}
                    {selectedInvoice.paidAt && (
                      <div><strong>Paid:</strong> {formatDate(selectedInvoice.paidAt)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>Invoice Items</h3>
                  <div style={{ 
                    background: 'var(--bg-secondary)', 
                    borderRadius: 'var(--radius-md)', 
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--bg-tertiary)' }}>
                        <tr>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Description</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Qty</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Rate</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: 'var(--text-secondary)'
                            }}>{item.description}</td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'right',
                              color: 'var(--text-secondary)'
                            }}>{item.quantity}</td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'right',
                              color: 'var(--text-secondary)'
                            }}>{formatCurrency(item.rate)}</td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'right',
                              color: 'var(--text-primary)',
                              fontWeight: 600
                            }}>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                        <tr style={{ 
                          borderTop: '2px solid var(--border)', 
                          background: 'var(--bg-tertiary)' 
                        }}>
                          <td colSpan={3} style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 700
                          }}>Total:</td>
                          <td style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '1.1rem'
                          }}>{formatCurrency(selectedInvoice.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payments History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>Payment History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {selectedInvoice.payments.map((payment) => (
                      <div key={payment.id} style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {payment.method} • {formatDate(payment.paymentDate)}
                          </div>
                          {payment.transactionId && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              ID: {payment.transactionId}
                            </div>
                          )}
                        </div>
                        <span className={`${styles.statusBadge} ${styles.status} ${styles.paid}`}>
                          <span className={styles.statusDot}></span>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'flex-end',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                >
                  <Download size={16} />
                  Download PDF
                </button>
                {selectedInvoice.status === 'Draft' && (
                  <>
                    <button 
                        className={styles.secondaryButton}
                        onClick={() => {
                            setEditingInvoice(selectedInvoice);
                            setShowInvoiceModal(true);
                            setSelectedInvoice(null);
                        }}
                        >
                        <Edit size={16} />
                        Edit Invoice
                    </button>
                    {selectedInvoice.status === 'Draft' && (
                      <button 
                        className={styles.primaryButton}
                        onClick={() => {
                          setInvoiceToSend(selectedInvoice);
                          setSendFormData({
                            toEmail: '', // Pre-populate if you have client email
                            subject: `Invoice #${selectedInvoice.invoiceNumber}`,
                            message: `Dear ${selectedInvoice.clientName},\n\nPlease find your invoice attached.\n\nThank you for your business.`
                          });
                          setShowSendModal(true);
                          setSelectedInvoice(null);
                        }}
                      >
                        <Send size={16} />
                        Send Invoice
                      </button>
                    )}
                  </>
                )}
                {selectedInvoice.status === 'Sent' && (
                  <button 
                    className={styles.primaryButton}
                    onClick={() => handleStatusUpdate(selectedInvoice.id, 'Paid')}
                  >
                    <CheckCircle size={16} />
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && invoiceToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={24} />
                Delete Invoice
              </h2>
            </header>

            <div className={styles.modalDeleteContent}>
              <p className={styles.confirmationText}>
                Are you sure you want to delete invoice <strong>#{invoiceToDelete.invoiceNumber}</strong>?
              </p>
              <p className={styles.warningText}>
                This action cannot be undone. All associated records will also be removed.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={`${styles.deleteActionButton} ${styles.secondaryAction}`}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.deleteActionButton} ${styles.dangerAction}`}
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
            setShowInvoiceModal(false);
            setEditingInvoice(null);
        }}
        onSubmit={handleInvoiceSubmit}
        projects={projects}
        invoice={editingInvoice}
        mode={editingInvoice ? 'edit' : 'add'}
      />
      {showSendModal && invoiceToSend && (
        <div className={styles.modalOverlay} onClick={!isSending ? () => setShowSendModal(false) : undefined}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Send size={24} />
                Send Invoice #{invoiceToSend.invoiceNumber}
              </h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowSendModal(false)}
                disabled={isSending}
              >
                <X size={18} />
              </button>
            </header>

            <div className={styles.modalDeleteContent}>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSendInvoice(sendFormData);
              }}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-sm)', 
                    color: 'var(--text-primary)', 
                    fontWeight: 600 
                  }}>
                    To Email *
                  </label>
                  <input
                    type="email"
                    className={styles.filterInput}
                    value={sendFormData.toEmail}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, toEmail: e.target.value }))}
                    required
                    placeholder="client@example.com"
                    style={{ width: '100%' }}
                    disabled={isSending}
                  />
                </div>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-sm)', 
                    color: 'var(--text-primary)', 
                    fontWeight: 600 
                  }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    value={sendFormData.subject}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                    disabled={isSending}
                  />
                </div>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-sm)', 
                    color: 'var(--text-primary)', 
                    fontWeight: 600 
                  }}>
                    Message *
                  </label>
                  <textarea
                    className={styles.filterInput}
                    value={sendFormData.message}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    rows={5}
                    style={{ width: '100%', resize: 'vertical' }}
                    disabled={isSending}
                  />
                </div>

                {/* Error Message */}
                {sendError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    color: '#ef4444',
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '0.9rem'
                  }}>
                    {sendError}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button 
                    type="button"
                    className={`${styles.deleteActionButton} ${styles.secondaryAction}`}
                    onClick={() => {
                      setShowSendModal(false);
                      setSendError('');
                      setInvoiceToSend(null);
                      setSendFormData({ toEmail: '', subject: '', message: '' });
                    }}
                    disabled={isSending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={`${styles.deleteActionButton} ${styles.primaryButton} ${isSending ? styles.sendingButton : ''}`}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <div className={styles.spinner} style={{ width: '16px', height: '16px', marginRight: '8px' }} />
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
        </div>
      )}
    </div>
  );
}