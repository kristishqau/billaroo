import { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import {
  User as UserIcon,
  Key,
  Shield,
  Calendar,
  LogIn,
  AlertTriangle,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Edit,
  RefreshCw,
  EyeOff,
  Eye,
  Mail
} from 'lucide-react';

// Define types for user profile and account summary data
type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type AccountStatus = {
  isActive: boolean;
  isEmailVerified: boolean;
  isAccountLocked: boolean;
  lockoutEnd: string | null;
  failedLoginAttempts: number;
  createdAt: string;
  lastLoginAt: string | null;
  requiresPasswordChange: boolean;
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
};

type UnpaidInvoice = {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
};

type ActiveProject = {
  title: string;
  clientName: string;
  deadline: string;
};

export default function App() {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [, setAccountSummary] = useState<AccountSummary | null>(null); // For freelancers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [profileEditError, setProfileEditError] = useState<string | null>(null);
  const [profileEditSuccess, setProfileEditSuccess] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Account Deletion State
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

  // Fetch profile data on component mount or when user context changes
  useEffect(() => {
    fetchProfileData();
  }, [user]); 

  /**
   * Fetches the user's profile, account status, and (for freelancers) account summary.
   * Handles loading, error states, and unauthorized access.
   */
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Fetch user profile
      const profileRes = await axios.get<UserProfile>('/user/profile');
      setProfile(profileRes.data);
      setEditedUsername(profileRes.data.username);
      setEditedEmail(profileRes.data.email);

      // Fetch account status
      const statusRes = await axios.get<AccountStatus>('/auth/account-status');
      setAccountStatus(statusRes.data);

      // Fetch account summary only if user is a freelancer
      if (user?.role === 'freelancer') {
        const summaryRes = await axios.get<AccountSummary>('/user/account-summary');
        setAccountSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch profile data:', err);
      setError('Failed to load profile data. Please try again.');
      // If unauthorized (e.g., token expired), log out the user
      if (err.response?.status === 401) {
        logout(); 
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles resending the email verification email.
   * Shows loading state and success/error messages.
   */
  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    setVerificationMessage(null);
    setVerificationError(null);
    try {
      await axios.post('/auth/resend-verification');
      setVerificationMessage('Verification email sent successfully! Please check your inbox.');
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setVerificationError(err.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  /**
   * Handles the submission for updating profile information (username and email).
   * Displays success or error messages.
   */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEditError(null);
    setProfileEditSuccess(null);
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        username: editedUsername,
        email: editedEmail,
      });
      setProfile(res.data);
      setProfileEditSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      refreshUser(); // Update user context if username/email changed
    } catch (err: any) {
      console.error('Profile update error:', err);
      setProfileEditError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  /**
   * Handles the submission for changing the user's password.
   * Validates new password and displays success or error messages.
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }
    try {
      await axios.put('/user/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setPasswordChangeSuccess('Password changed successfully!');
      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordChangeError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  /**
   * Handles the export of user data.
   * Triggers a file download and shows success/error messages.
   */
  const handleExportData = async () => {
    setSuccessMessage(null);
    setError(null);
    try {
      const response = await axios.get('/user/export-data', {
        responseType: 'blob', // Important for downloading files
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `billaroo_data_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      setSuccessMessage('Your data export has started!');
    } catch (err: any) {
      console.error('Export data error:', err);
      setError('Failed to export data. Please try again.');
    }
  };

  /**
   * Sends a request to the backend to validate account deletion and retrieve any blocking conditions.
   * This populates the modal with warnings for the user.
   */
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
        // These are false for the initial request to get warnings
        forceDelete: false, 
        acknowledgeDataLoss: false, 
      });
      // If successful, it means no blocking conditions or warnings needed
      setDeleteWarning('Ready to delete. Confirm below.');
      setCanForceDelete(res.data.canForceDelete || false);
      setRequiresAcknowledgment(res.data.requiresAcknowledgment || false);
    } catch (err: any) {
      console.error('Account deletion request error:', err);
      const data = err.response?.data;
      setDeleteWarning(data?.message || 'Failed to validate deletion request.');
      if (data?.unpaidInvoices) setUnpaidInvoices(data.unpaidInvoices);
      if (data?.activeProjects) setActiveProjects(data.activeProjects);
      setCanForceDelete(data?.canForceDelete || false);
      setRequiresAcknowledgment(data?.requiresAcknowledgment || false);
    }
  };

  /**
   * Performs the actual account deletion after user confirmation and validation.
   * Logs out the user on successful deletion.
   */
  const handleDeleteAccount = async () => {
    setDeleteWarning(null);
    setSuccessMessage(null);
    setError(null);

    // Client-side validation for confirmation text
    if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
      setDeleteWarning("Please type 'DELETE MY ACCOUNT' to confirm.");
      return;
    }

    // Client-side validation for acknowledgment checkboxes
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
        data: { // Data for DELETE requests is sent in the 'data' property
          password: deletePassword,
          confirmationText: deleteConfirmationText,
          forceDelete: forceDeleteChecked,
          acknowledgeDataLoss: acknowledgeDataLossChecked,
        },
      });
      setSuccessMessage('Account and all associated data deleted successfully. You will be logged out.');
      setShowDeleteModal(false);
      // Log out after a short delay to allow the success message to be seen
      setTimeout(() => logout(), 2000); 
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setDeleteWarning(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  /**
   * Formats a date string into a more readable format.
   * @param dateString The date string to format.
   * @returns Formatted date string or 'N/A' if null.
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Display loading state
  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.profileContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className={styles.profileContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.profileContent}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={fetchProfileData} className={styles.retryButton}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <Navbar variant="dashboard" />
      <div className={styles.profileContent}>
        {/* Profile Header Section */}
        <header className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            <UserIcon />
          </div>
          <h1 className={styles.profileUsername}>{profile?.username}</h1>
          <p className={styles.profileRole}>{profile?.role}</p>
        </header>

        {/* Profile Information Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <UserIcon size={20} /> Profile Information
          </h2>
          {profileEditSuccess && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {profileEditSuccess}
            </div>
          )}
          {profileEditError && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {profileEditError}
            </div>
          )}
          {!isEditingProfile ? (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Username</label>
                <input type="text" className={styles.formInput} value={profile?.username} disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input type="email" className={styles.formInput} value={profile?.email} disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input type="text" className={styles.formInput} value={profile?.role} disabled />
              </div>
              <button onClick={() => setIsEditingProfile(true)} className={styles.formButton}>
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate}>
              <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.formLabel}>Username</label>
                <input
                  id="username"
                  type="text"
                  className={styles.formInput}
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.formInput}
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input type="text" className={styles.formInput} value={profile?.role} disabled />
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button type="submit" className={styles.formButton}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className={`${styles.formButton} ${styles.exportButton}`}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Change Password Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Key size={20} /> Change Password
          </h2>
          {passwordChangeSuccess && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {passwordChangeSuccess}
            </div>
          )}
          {passwordChangeError && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {passwordChangeError}
            </div>
          )}
          <form onSubmit={handleChangePassword}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword" className={styles.formLabel}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.formLabel}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmNewPassword" className={styles.formLabel}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.formButton}>
              Change Password
            </button>
          </form>
        </section>

        {/* Account Status Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Shield size={20} /> Account Status
          </h2>
          {verificationMessage && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {verificationMessage}
            </div>
          )}
          {verificationError && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {verificationError}
            </div>
          )}
          {accountStatus && (
            <>
              <div className={styles.infoCard}>
                <CheckCircle size={20} className={styles.infoIcon} style={{ color: accountStatus.isEmailVerified ? 'var(--success)' : 'var(--danger)' }} />
                <div style={{ flex: 1 }}>
                  <p className={styles.infoText}>
                    Email Verification: <span>{accountStatus.isEmailVerified ? 'Verified' : 'Not Verified'}</span>
                  </p>
                  {!accountStatus.isEmailVerified && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <button 
                        onClick={handleResendVerification} 
                        className={styles.formButton}
                        disabled={isResendingVerification}
                        style={{ 
                          fontSize: '0.875rem', 
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          height: 'auto'
                        }}
                      >
                        <Mail size={14} />
                        {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.infoCard}>
                <Info size={20} className={styles.infoIcon} style={{ color: accountStatus.isAccountLocked ? 'var(--danger)' : 'var(--success)' }} />
                <p className={styles.infoText}>
                  Account Status: <span>{accountStatus.isAccountLocked ? 'Locked' : 'Active'}</span>
                  {accountStatus.isAccountLocked && accountStatus.lockoutEnd && (
                    <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}> (Locked until {formatDate(accountStatus.lockoutEnd)})</span>
                  )}
                </p>
              </div>
              <div className={styles.infoCard}>
                <LogIn size={20} className={styles.infoIcon} />
                <p className={styles.infoText}>
                  Last Login: <span>{formatDate(accountStatus.lastLoginAt)}</span>
                </p>
              </div>
              <div className={styles.infoCard}>
                <Calendar size={20} className={styles.infoIcon} />
                <p className={styles.infoText}>
                  Account Created: <span>{formatDate(accountStatus.createdAt)}</span>
                </p>
              </div>
            </>
          )}
        </section>

        {/* Account Management Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Trash2 size={20} /> Account Management
          </h2>
          {successMessage && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {successMessage}
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button onClick={handleExportData} className={styles.exportButton}>
              <Download size={16} /> Export My Data
            </button>
            <button onClick={() => setShowDeleteModal(true)} className={styles.deleteButton}>
              <Trash2 size={16} /> Delete My Account
            </button>
          </div>
        </section>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <button onClick={() => setShowDeleteModal(false)} className={styles.modalCloseButton}>
                <XCircle size={24} />
              </button>
              <h3 className={styles.modalTitle}>
                <AlertTriangle size={24} /> Confirm Account Deletion
              </h3>
              <p className={styles.modalDescription}>
                Deleting your account is a permanent action and will remove all your data.
                This cannot be undone.
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="deletePassword" className={styles.formLabel}>Enter your password to proceed</label>
                <input
                  id="deletePassword"
                  type="password"
                  className={styles.formInput}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onBlur={handleRequestDeletion} // Validate password on blur to get warnings
                  required
                />
              </div>

              {deleteWarning && (
                <div className={styles.modalWarning}>
                  <AlertTriangle size={20} />
                  <div>
                    <p>{deleteWarning}</p>
                    {unpaidInvoices.length > 0 && (
                      <>
                        <p>You have unpaid invoices:</p>
                        <ul>
                          {unpaidInvoices.map((inv, i) => (
                            <li key={i}>
                              {inv.invoiceNumber} (Client: {inv.clientName}, Amount: ${inv.amount}, Status: {inv.status})
                            </li>
                          ))}
                        </ul>
                        {canForceDelete && (
                          <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                            <input
                              type="checkbox"
                              checked={forceDeleteChecked}
                              onChange={(e) => setForceDeleteChecked(e.target.checked)}
                              style={{ marginRight: '8px' }}
                            />
                            Force Delete (I understand this will delete all associated data even with unpaid invoices)
                          </label>
                        )}
                      </>
                    )}
                    {activeProjects.length > 0 && (
                      <>
                        <p>You have active projects:</p>
                        <ul>
                          {activeProjects.map((proj, i) => (
                            <li key={i}>
                              {proj.title} (Client: {proj.clientName}, Deadline: {formatDate(proj.deadline)})
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {requiresAcknowledgment && (
                      <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                        <input
                          type="checkbox"
                          checked={acknowledgeDataLossChecked}
                          onChange={(e) => setAcknowledgeDataLossChecked(e.target.checked)}
                          style={{ marginRight: '8px' }}
                        />
                        I understand that deleting my account will permanently remove all my data.
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="confirmText" className={styles.formLabel}>Type "DELETE MY ACCOUNT" to confirm</label>
                <input
                  id="confirmText"
                  type="text"
                  className={styles.formInput}
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button onClick={() => setShowDeleteModal(false)} className={styles.modalCancelButton}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} className={styles.modalConfirmButton}
                  disabled={
                    deleteConfirmationText !== 'DELETE MY ACCOUNT' || // Must type confirmation text
                    (requiresAcknowledgment && !acknowledgeDataLossChecked) || // Must acknowledge data loss if required
                    (canForceDelete && !forceDeleteChecked) // Must force delete if required
                  }
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}