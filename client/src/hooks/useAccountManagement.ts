import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';
import { useAuth } from '../context/AuthContext';

interface UnpaidInvoice {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
}

interface ActiveProject {
  title: string;
  clientName: string;
  deadline: string;
}

export const useAccountManagement = () => {
  const { logout } = useAuth();
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [canForceDelete, setCanForceDelete] = useState(false);
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(false);
  const [forceDeleteChecked, setForceDeleteChecked] = useState(false);
  const [acknowledgeDataLossChecked, setAcknowledgeDataLossChecked] = useState(false);

  const notification = useNotification();

  const handleExportData = async () => {
    notification.clearNotification();
    
    try {
      const response = await axios.get('/user/export-data', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `billaroo_data_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      notification.showSuccess('Your data export has started!');
    } catch {
      notification.showError('Failed to export data. Please try again.');
    }
  };

  const handleRequestDeletion = async () => {
    setDeleteWarning(null);
    setUnpaidInvoices([]);
    setActiveProjects([]);
    setCanForceDelete(false);
    setRequiresAcknowledgment(false);
    setForceDeleteChecked(false);
    setAcknowledgeDataLossChecked(false);

    try {
      const res = await axios.post('/user/request-account-deletion', {
        password: deletePassword,
        forceDelete: false,
        acknowledgeDataLoss: false
      });
      
      setDeleteWarning('Ready to delete. Confirm below.');
      setCanForceDelete(res.data.canForceDelete || false);
      setRequiresAcknowledgment(res.data.requiresAcknowledgment || false);
    } catch (err: any) {
      const data = err.response?.data;
      setDeleteWarning(data?.message || 'Failed to validate deletion request.');
      if (data?.unpaidInvoices) setUnpaidInvoices(data.unpaidInvoices);
      if (data?.activeProjects) setActiveProjects(data.activeProjects);
      setCanForceDelete(data?.canForceDelete || false);
      setRequiresAcknowledgment(data?.requiresAcknowledgment || false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteWarning(null);
    notification.clearNotification();

    // Client-side validation
    if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
      setDeleteWarning("Please type 'DELETE MY ACCOUNT' to confirm.");
      return;
    }

    if (requiresAcknowledgment && !acknowledgeDataLossChecked) {
      setDeleteWarning("Please acknowledge data loss to proceed.");
      return;
    }

    if (canForceDelete && !forceDeleteChecked) {
      setDeleteWarning("Please check the 'Force Delete' option to proceed with unpaid invoices.");
      return;
    }

    try {
      await axios.delete('/user/delete-account', {
        data: {
          password: deletePassword,
          confirmationText: deleteConfirmationText,
          forceDelete: forceDeleteChecked,
          acknowledgeDataLoss: acknowledgeDataLossChecked
        }
      });
      
      notification.showSuccess('Account and all associated data deleted successfully. You will be logged out.');
      setShowDeleteModal(false);
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setDeleteWarning(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const resetDeleteForm = () => {
    setDeletePassword('');
    setDeleteConfirmationText('');
    setDeleteWarning(null);
    setUnpaidInvoices([]);
    setActiveProjects([]);
    setCanForceDelete(false);
    setRequiresAcknowledgment(false);
    setForceDeleteChecked(false);
    setAcknowledgeDataLossChecked(false);
  };

  return {
    // Delete account states
    showDeleteModal,
    setShowDeleteModal,
    deletePassword,
    setDeletePassword,
    deleteConfirmationText,
    setDeleteConfirmationText,
    deleteWarning,
    unpaidInvoices,
    activeProjects,
    canForceDelete,
    requiresAcknowledgment,
    forceDeleteChecked,
    setForceDeleteChecked,
    acknowledgeDataLossChecked,
    setAcknowledgeDataLossChecked,
    
    // Handlers
    handleExportData,
    handleRequestDeletion,
    handleDeleteAccount,
    resetDeleteForm,
    
    // Notification
    notification
  };
};