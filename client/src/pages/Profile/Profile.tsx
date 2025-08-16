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
  Mail,
  Award,
  LinkIcon,
  Briefcase,
  Phone,
  FileText
} from 'lucide-react';

type UserSkill = {
  id: number;
  skillName: string;
  proficiencyLevel: number;
  isVerified: boolean;
  createdAt: string;
};

type ProfileCompletion = {
  hasBasicInfo: boolean;
  hasContactInfo: boolean;
  hasProfessionalInfo: boolean;
  hasSkills: boolean;
  hasVerification: boolean;
  completionPercentage: number;
  missingFields: string[];
};

type LoginHistory = {
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isSuccessful: boolean;
  isTwoFactorUsed: boolean;
};

type SecuritySettings = {
  twoFactorEnabled: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  lastPasswordChange?: string;
  recentLogins?: LoginHistory[];
};

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  timeZone?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  cvUploadedAt?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isProfileComplete: boolean;
  verificationStatus?: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowMessages: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  skills?: UserSkill[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingProfessionalInfo, setIsEditingProfessionalInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedJobTitle, setEditedJobTitle] = useState('');
  const [editedCompany, setEditedCompany] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedLinkedInUrl, setEditedLinkedInUrl] = useState('');
  const [editedGitHubUrl, setEditedGitHubUrl] = useState('');
  const [editedPortfolioUrl, setEditedPortfolioUrl] = useState('');
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedCountry, setEditedCountry] = useState('');

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

  // Phone Verification State
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [isPhoneVerificationSent, setIsPhoneVerificationSent] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);
  const [phoneVerificationSuccess, setPhoneVerificationSuccess] = useState<string | null>(null);

  // File Upload States
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);

  // Skills Management State
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState(3);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);

  // Privacy Settings State
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [allowMessages, setAllowMessages] = useState(false);

  // Notification Preferences State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Email verification
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showIdentityVerificationModal, setShowIdentityVerificationModal] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [identityFiles, setIdentityFiles] = useState<{
    frontId?: File;
    backId?: File;
    selfie?: File;
  }>({});
  const [isUploadingIdentity, setIsUploadingIdentity] = useState(false);

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
      initializeFormFields(profileRes.data);

      // Fetch security settings
      const securityRes = await axios.get<SecuritySettings>('/user/security-settings');
      setSecuritySettings(securityRes.data);

      // Fetch profile completion
      const completionRes = await axios.get<ProfileCompletion>('/user/profile-completion');
      setProfileCompletion(completionRes.data);

      // Create account status from profile data (since your backend doesn't have a separate endpoint)
      const accountStatusData: AccountStatus = {
        isActive: true, // Assume active if we can fetch profile
        isEmailVerified: profileRes.data.isEmailVerified,
        isAccountLocked: false, // You can add this logic based on your backend
        lockoutEnd: null,
        failedLoginAttempts: 0,
        createdAt: profileRes.data.createdAt,
        lastLoginAt: profileRes.data.lastLoginAt || null,
        requiresPasswordChange: false
      };
      setAccountStatus(accountStatusData);

    } catch (err: any) {
      console.error('Failed to fetch profile data:', err);
      setError('Failed to load profile data. Please try again.');
      if (err.response?.status === 401) {
        logout(); 
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initializes form fields with profile data
   */
  const initializeFormFields = (profileData: UserProfile) => {
    // Basic info
    setEditedUsername(profileData.username);
    setEditedEmail(profileData.email);
    
    // Personal info
    setEditedFirstName(profileData.firstName || '');
    setEditedLastName(profileData.lastName || '');
    setEditedBio(profileData.bio || '');
    
    // Professional info
    setEditedJobTitle(profileData.jobTitle || '');
    setEditedCompany(profileData.company || '');
    setEditedWebsite(profileData.website || '');
    setEditedLinkedInUrl(profileData.linkedInUrl || '');
    setEditedGitHubUrl(profileData.gitHubUrl || '');
    setEditedPortfolioUrl(profileData.portfolioUrl || '');
    
    // Contact info
    setEditedPhoneNumber(profileData.phoneNumber || '');
    setEditedCity(profileData.city || '');
    setEditedCountry(profileData.country || '');
    
    // Privacy settings
    setShowEmail(profileData.showEmail);
    setShowPhone(profileData.showPhone);
    setShowAddress(profileData.showAddress);
    setAllowMessages(profileData.allowMessages);
    
    // Notification preferences
    setEmailNotifications(profileData.emailNotifications);
    setSmsNotifications(profileData.smsNotifications);
    setMarketingEmails(profileData.marketingEmails);
    
    // Skills
    setSkills(profileData.skills || []);
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
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        username: editedUsername,
        email: editedEmail,
      });
      setProfile(res.data);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      refreshUser(); // Update user context if username/email changed
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
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
   * Handles personal information update
   */
  const handlePersonalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        firstName: editedFirstName,
        lastName: editedLastName,
        bio: editedBio,
      });
      setProfile(res.data);
      setSuccessMessage('Personal information updated successfully!');
      setIsEditingPersonalInfo(false);
    } catch (err: any) {
      console.error('Personal info update error:', err);
      setError(err.response?.data?.message || 'Failed to update personal information.');
    }
  };

  /**
   * Handles professional information update
   */
  const handleProfessionalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        jobTitle: editedJobTitle,
        company: editedCompany,
        website: editedWebsite,
        linkedInUrl: editedLinkedInUrl,
        gitHubUrl: editedGitHubUrl,
        portfolioUrl: editedPortfolioUrl,
      });
      setProfile(res.data);
      setSuccessMessage('Professional information updated successfully!');
      setIsEditingProfessionalInfo(false);
    } catch (err: any) {
      console.error('Professional info update error:', err);
      setError(err.response?.data?.message || 'Failed to update professional information.');
    }
  };

  /**
   * Handles contact information update
   */
  const handleContactInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        phoneNumber: editedPhoneNumber,
        city: editedCity,
        country: editedCountry,
      });
      setProfile(res.data);
      setSuccessMessage('Contact information updated successfully!');
      setIsEditingContactInfo(false);
    } catch (err: any) {
      console.error('Contact info update error:', err);
      setError(err.response?.data?.message || 'Failed to update contact information.');
    }
  };

  /**
   * Sends phone verification code
   */
  const handleSendPhoneVerification = async () => {
    setPhoneVerificationError(null);
    setPhoneVerificationSuccess(null);
    try {
      await axios.post('/user/send-phone-verification', {
        phoneNumber: editedPhoneNumber,
      });
      setIsPhoneVerificationSent(true);
      setPhoneVerificationSuccess('Verification code sent to your phone!');
    } catch (err: any) {
      console.error('Send phone verification error:', err);
      setPhoneVerificationError(err.response?.data?.message || 'Failed to send verification code.');
    }
  };

  /**
   * Verifies phone number
   */
  const handleVerifyPhone = async () => {
    setPhoneVerificationError(null);
    setPhoneVerificationSuccess(null);
    try {
      await axios.post('/user/verify-phone', {
        verificationCode: phoneVerificationCode,
      });
      setPhoneVerificationSuccess('Phone number verified successfully!');
      setIsPhoneVerificationSent(false);
      setPhoneVerificationCode('');
    } catch (err: any) {
      console.error('Phone verification error:', err);
      setPhoneVerificationError(err.response?.data?.message || 'Failed to verify phone number.');
    }
  };

  /**
   * Handles profile image upload
   */
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setError(null);
    setSuccessMessage(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit) - Show error but don't break the page
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. Please choose a smaller file.');
      // Reset the input
      e.target.value = '';
      return;
    }

    setUploadingProfileImage(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/user/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage('Profile image uploaded successfully!');
      }
      
      // Refresh profile data to get the new image URL
      await fetchProfileData();
    } catch (err: any) {
      console.error('Profile image upload error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          'Failed to upload profile image. Please try again.';
      setError(errorMessage);
    } finally {
      setUploadingProfileImage(false);
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  /**
   * Handles CV upload
   */
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setError(null);
    setSuccessMessage(null);

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a valid CV file (PDF, DOC, or DOCX)');
      e.target.value = '';
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('CV file size must be less than 10MB. Please choose a smaller file.');
      e.target.value = '';
      return;
    }

    setUploadingCv(true);

    const formData = new FormData();
    formData.append('cvFile', file);

    try {
      const response = await axios.post('/user/upload-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage('CV uploaded successfully!');
      }
    } catch (err: any) {
      console.error('CV upload error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          'Failed to upload CV. Please try again.';
      setError(errorMessage);
    } finally {
      setUploadingCv(false);
      e.target.value = '';
    }
  };

  /**
   * Handles enabling two-factor authentication
   */
  const handleEnable2FA = async () => {
    setShowTwoFactorModal(true);
    setIsEnabling2FA(true);
    setTwoFactorError(null);
    
    try {
      const response = await axios.post('/auth/enable-2fa');
      setQrCode(response.data.qrCode);
    } catch (err: any) {
      console.error('Enable 2FA error:', err);
      setTwoFactorError(err.response?.data?.message || 'Failed to enable 2FA.');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  /**
   * Verifies and confirms 2FA setup
   */
  const handleConfirm2FA = async () => {
    setTwoFactorError(null);
    
    try {
      await axios.post('/auth/verify-2fa-setup', {
        code: twoFactorCode
      });
      setSuccessMessage('Two-factor authentication enabled successfully!');
      setShowTwoFactorModal(false);
      setTwoFactorCode('');
    } catch (err: any) {
      console.error('Verify 2FA error:', err);
      setTwoFactorError(err.response?.data?.message || 'Invalid verification code.');
    }
  };

  /**
   * Handles disabling two-factor authentication
   */
  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }
    
    try {
      await axios.post('/auth/disable-2fa');
      setSuccessMessage('Two-factor authentication disabled.');
    } catch (err: any) {
      console.error('Disable 2FA error:', err);
      setError(err.response?.data?.message || 'Failed to disable 2FA.');
    }
  };

  /**
   * Handles identity verification file upload
  */
  const handleIdentityVerification = async () => {
    if (!identityFiles.frontId || !identityFiles.selfie) {
      setError('Please upload at least your ID front and a selfie.');
      return;
    }

    setIsUploadingIdentity(true);
    setError(null);
    
    const formData = new FormData();
    if (identityFiles.frontId) formData.append('frontId', identityFiles.frontId);
    if (identityFiles.backId) formData.append('backId', identityFiles.backId);
    if (identityFiles.selfie) formData.append('selfie', identityFiles.selfie);

    try {
      await axios.post('/user/verify-identity', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Identity verification documents uploaded successfully! We will review them within 1-2 business days.');
      setShowIdentityVerificationModal(false);
      setIdentityFiles({});
    } catch (err: any) {
      console.error('Identity verification error:', err);
      setError(err.response?.data?.message || 'Failed to upload identity verification documents.');
    } finally {
      setIsUploadingIdentity(false);
    }
  };

  /**
   * Adds a new skill
   */
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSkillError(null);
    setIsAddingSkill(true);

    try {
      const response = await axios.post('/user/skills', {
        skillName: newSkillName,
        proficiencyLevel: newSkillProficiency,
      });
      setSkills([...skills, response.data]);
      setNewSkillName('');
      setNewSkillProficiency(3);
      setSuccessMessage('Skill added successfully!');
    } catch (err: any) {
      console.error('Add skill error:', err);
      setSkillError(err.response?.data?.message || 'Failed to add skill.');
    } finally {
      setIsAddingSkill(false);
    }
  };

  /**
   * Deletes a skill
   */
  const handleDeleteSkill = async (skillId: number) => {
    try {
      await axios.delete(`/user/skills/${skillId}`);
      setSkills(skills.filter(skill => skill.id !== skillId));
      setSuccessMessage('Skill deleted successfully!');
    } catch (err: any) {
      console.error('Delete skill error:', err);
      setError(err.response?.data?.message || 'Failed to delete skill.');
    }
  };

  /**
   * Updates privacy settings
   */
  const handlePrivacySettingsUpdate = async () => {
    try {
      await axios.put('/user/privacy-settings', {
        showEmail,
        showPhone,
        showAddress,
        allowMessages,
      });
      setSuccessMessage('Privacy settings updated successfully!');
    } catch (err: any) {
      console.error('Privacy settings update error:', err);
      setError(err.response?.data?.message || 'Failed to update privacy settings.');
    }
  };

  /**
   * Updates notification preferences
   */
  const handleNotificationPreferencesUpdate = async () => {
    try {
      await axios.put('/user/preferences', {
        emailNotifications,
        smsNotifications,
        marketingEmails,
        timeZone: profile?.timeZone || 'UTC', // Include timezone
      });
      setSuccessMessage('Notification preferences updated successfully!');
    } catch (err: any) {
      console.error('Notification preferences update error:', err);
      setError(err.response?.data?.message || 'Failed to update notification preferences.');
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
            {profile?.profileImageUrl ? (
              <img 
                src={`https://localhost:7263${profile.profileImageUrl}`}
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => {
                  console.error('Failed to load profile image:', profile.profileImageUrl);
                  // Hide the broken image and show the default icon instead
                  e.currentTarget.style.display = 'none';
                  const parentDiv = e.currentTarget.parentElement;
                  if (parentDiv) {
                    const iconElement = document.createElement('div');
                    iconElement.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                    iconElement.style.display = 'flex';
                    iconElement.style.alignItems = 'center';
                    iconElement.style.justifyContent = 'center';
                    iconElement.style.width = '100%';
                    iconElement.style.height = '100%';
                    iconElement.style.color = 'var(--text-muted)';
                    parentDiv.appendChild(iconElement);
                  }
                }}
                onLoad={() => {
                  // Remove any fallback icon if image loads successfully
                  const parentDiv = (document.querySelector(`img[src="${profile.profileImageUrl}"]`) as HTMLImageElement)?.parentElement;
                  if (parentDiv) {
                    const fallbackIcon = parentDiv.querySelector('div:last-child');
                    if (fallbackIcon && fallbackIcon !== parentDiv.firstElementChild) {
                      fallbackIcon.remove();
                    }
                  }
                }}
              />
            ) : (
              <UserIcon />
            )}
          </div>
          <h1 className={styles.profileUsername}>
            {profile?.firstName && profile?.lastName 
              ? `${profile.firstName} ${profile.lastName}` 
              : profile?.username}
          </h1>
          <p className={styles.profileRole}>{profile?.role}</p>
          
          {/* Profile Image Upload */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <input
              type="file"
              id="profileImageUpload"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleProfileImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => document.getElementById('profileImageUpload')?.click()}
              className={styles.exportButton}
              disabled={uploadingProfileImage}
              style={{ 
                fontSize: '0.875rem', 
                padding: 'var(--spacing-sm) var(--spacing-md)',
                opacity: uploadingProfileImage ? 0.6 : 1,
                cursor: uploadingProfileImage ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadingProfileImage ? (
                <>
                  <RefreshCw size={16} className="animate-spin" style={{ marginRight: '6px' }} />
                  Uploading...
                </>
              ) : (
                'Change Photo'
              )}
            </button>
            
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              marginTop: 'var(--spacing-xs)', 
              textAlign: 'center' 
            }}>
              Supported: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

          {/* Profile Completion Progress - REMOVE THE SAVE/CANCEL BUTTONS */}
          {profileCompletion && (
            <div style={{ marginTop: 'var(--spacing-lg)', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Profile Completion</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {profileCompletion.completionPercentage}%
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${profileCompletion.completionPercentage}%`,
                  height: '100%',
                  background: 'var(--gradient-primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {profileCompletion.missingFields.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                  {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} more`}
                </p>
              )}
            </div>
          )}
        </header>

        {/* Personal Information Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <UserIcon size={20} /> Personal Information
          </h2>
          {successMessage && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {successMessage}
            </div>
          )}
          {error && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {error}
            </div>
          )}
          
          {!isEditingPersonalInfo ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>First Name</label>
                  <input type="text" className={styles.formInput} value={profile?.firstName || 'Not set'} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Last Name</label>
                  <input type="text" className={styles.formInput} value={profile?.lastName || 'Not set'} disabled />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bio</label>
                <textarea 
                  className={styles.formInput} 
                  value={profile?.bio || 'Not set'} 
                  disabled 
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button onClick={() => setIsEditingPersonalInfo(true)} className={styles.formButton}>
                <Edit size={16} /> Edit Personal Info
              </button>
            </div>
          ) : (
            <form onSubmit={handlePersonalInfoUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.formLabel}>First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    className={styles.formInput}
                    value={editedFirstName}
                    onChange={(e) => setEditedFirstName(e.target.value)}
                    placeholder="Your first name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.formLabel}>Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    className={styles.formInput}
                    value={editedLastName}
                    onChange={(e) => setEditedLastName(e.target.value)}
                    placeholder="Your last name"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="bio" className={styles.formLabel}>Bio</label>
                <textarea
                  id="bio"
                  className={styles.formInput}
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button type="submit" className={styles.formButton}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPersonalInfo(false)}
                  className={styles.exportButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Profile Information Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <UserIcon size={20} /> Profile Information
          </h2>
          {successMessage && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {successMessage}
            </div>
          )}
          {error && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {error}
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

        {/* Professional Information Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Briefcase size={20} /> Professional Information
          </h2>
          
          {!isEditingProfessionalInfo ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Job Title</label>
                  <input type="text" className={styles.formInput} value={profile?.jobTitle || 'Not set'} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company</label>
                  <input type="text" className={styles.formInput} value={profile?.company || 'Not set'} disabled />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Website</label>
                  <input type="url" className={styles.formInput} value={profile?.website || 'Not set'} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>LinkedIn</label>
                  <input type="url" className={styles.formInput} value={profile?.linkedInUrl || 'Not set'} disabled />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>GitHub</label>
                  <input type="url" className={styles.formInput} value={profile?.gitHubUrl || 'Not set'} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Portfolio</label>
                  <input type="url" className={styles.formInput} value={profile?.portfolioUrl || 'Not set'} disabled />
                </div>
              </div>

              <button onClick={() => setIsEditingProfessionalInfo(true)} className={styles.formButton}>
                <Edit size={16} /> Edit Professional Info
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfessionalInfoUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="jobTitle" className={styles.formLabel}>Job Title</label>
                  <input
                    id="jobTitle"
                    type="text"
                    className={styles.formInput}
                    value={editedJobTitle}
                    onChange={(e) => setEditedJobTitle(e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="company" className={styles.formLabel}>Company</label>
                  <input
                    id="company"
                    type="text"
                    className={styles.formInput}
                    value={editedCompany}
                    onChange={(e) => setEditedCompany(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="website" className={styles.formLabel}>Website</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="website"
                      type="url"
                      className={styles.formInput}
                      style={{ paddingLeft: '40px' }}
                      value={editedWebsite}
                      onChange={(e) => setEditedWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="linkedInUrl" className={styles.formLabel}>LinkedIn Profile</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="linkedInUrl"
                      type="url"
                      className={styles.formInput}
                      style={{ paddingLeft: '40px' }}
                      value={editedLinkedInUrl}
                      onChange={(e) => setEditedLinkedInUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="gitHubUrl" className={styles.formLabel}>GitHub Profile</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="gitHubUrl"
                      type="url"
                      className={styles.formInput}
                      style={{ paddingLeft: '40px' }}
                      value={editedGitHubUrl}
                      onChange={(e) => setEditedGitHubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="portfolioUrl" className={styles.formLabel}>Portfolio</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="portfolioUrl"
                      type="url"
                      className={styles.formInput}
                      style={{ paddingLeft: '40px' }}
                      value={editedPortfolioUrl}
                      onChange={(e) => setEditedPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button type="submit" className={styles.formButton}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfessionalInfo(false)}
                  className={styles.exportButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Contact Information Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Mail size={20} /> Contact Information
          </h2>
          {phoneVerificationSuccess && (
            <div className={styles.messageSuccess}>
              <CheckCircle size={18} /> {phoneVerificationSuccess}
            </div>
          )}
          {phoneVerificationError && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {phoneVerificationError}
            </div>
          )}
          {!isEditingContactInfo ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" className={styles.formInput} value={profile?.phoneNumber || 'Not set'} disabled />
                    {profile?.isPhoneVerified ? (
                      <CheckCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }} />
                    ) : (
                      <XCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)' }} />
                    )}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City</label>
                  <input type="text" className={styles.formInput} value={profile?.city || 'Not set'} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country</label>
                  <input type="text" className={styles.formInput} value={profile?.country || 'Not set'} disabled />
                </div>
              </div>
              <button onClick={() => setIsEditingContactInfo(true)} className={styles.formButton}>
                <Edit size={16} /> Edit Contact Info
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactInfoUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber" className={styles.formLabel}>Phone Number</label>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <input
                      id="phoneNumber"
                      type="tel"
                      className={styles.formInput}
                      value={editedPhoneNumber}
                      onChange={(e) => setEditedPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      style={{ flex: 1 }}
                    />
                    {!profile?.isPhoneVerified && editedPhoneNumber && (
                      <button
                        type="button"
                        onClick={handleSendPhoneVerification}
                        className={styles.exportButton}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  {isPhoneVerificationSent && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value)}
                        placeholder="Enter verification code"
                        style={{ marginBottom: 'var(--spacing-sm)' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhone}
                        className={styles.formButton}
                        style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                      >
                        Confirm Code
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.formLabel}>City</label>
                  <input
                    id="city"
                    type="text"
                    className={styles.formInput}
                    value={editedCity}
                    onChange={(e) => setEditedCity(e.target.value)}
                    placeholder="Your city"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.formLabel}>Country</label>
                  <input
                    id="country"
                    type="text"
                    className={styles.formInput}
                    value={editedCountry}
                    onChange={(e) => setEditedCountry(e.target.value)}
                    placeholder="Your country"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button type="submit" className={styles.formButton}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setIsEditingContactInfo(false)} className={styles.exportButton}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Skills Management Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Award size={20} /> Skills & Expertise
          </h2>
          
          {skillError && (
            <div className={styles.messageError}>
              <XCircle size={18} /> {skillError}
            </div>
          )}
          
          {/* Current Skills Grid */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            {skills.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                {skills.map((skill) => (
                  <div key={skill.id} className={styles.skillCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600' }}>
                          {skill.skillName}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: '4px' }}>
                          {skill.isVerified && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '500' }}>
                                Verified
                              </span>
                            </div>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Added {new Date(skill.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Proficiency Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Proficiency
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {skill.proficiencyLevel}/5
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(skill.proficiencyLevel / 5) * 100}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, 
                            ${skill.proficiencyLevel <= 2 ? 'var(--danger)' : 
                              skill.proficiencyLevel <= 3 ? 'var(--warning)' : 
                              'var(--success)'} 0%, 
                            ${skill.proficiencyLevel <= 2 ? '#f56565' : 
                              skill.proficiencyLevel <= 3 ? '#f6ad55' : 
                              '#68d391'} 100%)`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>No skills added yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
                  Showcase your expertise by adding your skills and proficiency levels
                </p>
              </div>
            )}
          </div>

          {/* Add New Skill Form */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-lg)'
          }}>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--text-primary)' }}>Add New Skill</h3>
            <form onSubmit={handleAddSkill}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label htmlFor="skillName" className={styles.formLabel}>Skill Name</label>
                  <input
                    id="skillName"
                    type="text"
                    className={styles.formInput}
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. JavaScript, UI/UX Design, Project Management"
                    required
                  />
                </div>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label htmlFor="proficiency" className={styles.formLabel}>Proficiency Level</label>
                  <select
                    id="proficiency"
                    className={styles.formSelect}
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Novice</option>
                    <option value={3}>3 - Intermediate</option>
                    <option value={4}>4 - Advanced</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className={styles.formButton}
                disabled={isAddingSkill || !newSkillName.trim()}
              >
                {isAddingSkill ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Award size={16} /> Add Skill
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* CV/Resume Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Download size={20} /> CV / Resume
          </h2>
          
          <div className={styles.infoCard}>
            <div style={{ flex: 1 }}>
              <p className={styles.infoText}>
                {profile?.cvUrl ? (
                  <>
                    CV uploaded on <span>{profile.cvUploadedAt ? formatDate(profile.cvUploadedAt) : 'Unknown date'}</span>
                  </>
                ) : (
                  'No CV uploaded yet. Upload your CV to showcase your experience.'
                )}
              </p>
              {profile?.cvUrl && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <a 
                    href={`https://localhost:7263${profile.cvUrl}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.exportButton}
                    style={{ 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)',
                      fontSize: '0.875rem',
                      padding: 'var(--spacing-sm) var(--spacing-md)'
                    }}
                  > View Resume
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <input
              type="file"
              id="cvUpload"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleCvUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => document.getElementById('cvUpload')?.click()}
              className={styles.formButton}
              disabled={uploadingCv}
              style={{ 
                opacity: uploadingCv ? 0.6 : 1,
                cursor: uploadingCv ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadingCv ? (
                <>
                  <RefreshCw size={16} className="animate-spin" style={{ marginRight: '6px' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <FileText size={16} style={{ marginRight: '6px' }} />
                  {profile?.cvUrl ? 'Update CV' : 'Upload CV'}
                </>
              )}
            </button>
            
            {/* Add file type hint */}
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              marginTop: 'var(--spacing-xs)' 
            }}>
              Supported formats: PDF, DOC, DOCX (max 10MB)
            </p>
          </div>
        </section>

        {/* Privacy Settings Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <EyeOff size={20} /> Privacy Settings
          </h2>
          
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Show Email Address</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Allow others to see your email address</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: showEmail ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: showEmail ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Show Phone Number</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Allow others to see your phone number</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: showPhone ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: showPhone ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Allow Messages</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Allow others to send you direct messages</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={allowMessages}
                  onChange={(e) => setAllowMessages(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: allowMessages ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: allowMessages ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>

          <button onClick={handlePrivacySettingsUpdate} className={styles.formButton} style={{ marginTop: 'var(--spacing-lg)' }}>
            Save Privacy Settings
          </button>
        </section>

        {/* Notification Preferences Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Info size={20} /> Notification Preferences
          </h2>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {/* Email Notifications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Email Notifications</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Receive important updates via email
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: emailNotifications ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: emailNotifications ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            {/* SMS Notifications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>SMS Notifications</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Receive urgent notifications via SMS
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: smsNotifications ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: smsNotifications ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            {/* Marketing Emails */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Marketing Emails</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Receive product updates and promotional content
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: marketingEmails ? 'var(--primary)' : 'var(--bg-tertiary)',
                  transition: '0.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: marketingEmails ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleNotificationPreferencesUpdate}
            className={styles.formButton}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Save Notification Preferences
          </button>

          {profileCompletion && (
            <>
              {/* Profile Completion Bar */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: 'var(--spacing-lg)'
              }}>
                <div style={{
                  width: `${profileCompletion.completionPercentage}%`,
                  height: '100%',
                  background: 'var(--gradient-primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {profileCompletion.missingFields.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                  {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} more`}
                </p>
              )}
            </>
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
                    right: '12px',
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
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
                      right: '12px',
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
                {newPassword && (
                  <div style={{ marginTop: 'var(--spacing-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.75rem' }}>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min((newPassword.length / 8) * 100, 100)}%`,
                          height: '100%',
                          backgroundColor: newPassword.length < 6 ? 'var(--danger)' : newPassword.length < 8 ? 'var(--warning)' : 'var(--success)',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                      <span style={{ color: newPassword.length < 6 ? 'var(--danger)' : newPassword.length < 8 ? 'var(--warning)' : 'var(--success)', whiteSpace: 'nowrap' }}>
                        {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                  </div>
                )}
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
                    style={{
                      borderColor: confirmNewPassword && newPassword !== confirmNewPassword ? 'var(--danger)' : undefined
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
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
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 'var(--spacing-xs)' }}>
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.formButton}
              disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
            >
              Change Password
            </button>
          </form>
        </section>

        {/* Account Status Section */}
        <section className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <Shield size={20} /> Account Status & Verification
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
          {accountStatus && securitySettings && (
            <>
              {/* Verification Status Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                {/* Email Verification */}
                <div className={`${styles.securityCard} ${securitySettings.isEmailVerified ? styles.verified : styles.unverified}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div className={`${styles.statusIcon} ${securitySettings.isEmailVerified ? styles.success : styles.danger}`}>
                      {securitySettings.isEmailVerified ? (
                        <CheckCircle size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Email Verification</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {securitySettings.isEmailVerified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </div>
                  </div>
                  {!securitySettings.isEmailVerified && (
                    <button 
                      onClick={handleResendVerification} 
                      className={styles.miniButton}
                      disabled={isResendingVerification}
                    >
                      <Mail size={14} />
                      {isResendingVerification ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                </div>

                {/* Phone Verification */}
                <div className={`${styles.securityCard} ${securitySettings.isPhoneVerified ? styles.verified : styles.warning}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div className={`${styles.statusIcon} ${securitySettings.isPhoneVerified ? styles.success : styles.warning}`}>
                      {securitySettings.isPhoneVerified ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Phone size={20} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Phone Verification</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {securitySettings.isPhoneVerified ? 'Phone verified' : 'Phone not verified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className={`${styles.securityCard} ${securitySettings.twoFactorEnabled ? styles.verified : styles.info}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div className={`${styles.statusIcon} ${securitySettings.twoFactorEnabled ? styles.success : styles.info}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Two-Factor Auth</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {securitySettings.twoFactorEnabled ? '2FA enabled' : '2FA disabled'}
                      </p>
                    </div>
                  </div>
                  <button 
                    className={styles.formButton}
                    onClick={securitySettings.twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                  >
                    {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {/* Identity Verification */}
                <div className={`${styles.securityCard} ${securitySettings.isIdentityVerified ? styles.verified : styles.warning}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div className={`${styles.statusIcon} ${securitySettings.isIdentityVerified ? styles.success : styles.warning}`}>
                      {securitySettings.isIdentityVerified ? (
                        <CheckCircle size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Identity Verification</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {securitySettings.isIdentityVerified ? 'Identity verified' : 'Identity not verified'}
                      </p>
                    </div>
                  </div>
                  {!securitySettings.isIdentityVerified && (
                    <button 
                      className={styles.formButton}
                      onClick={() => setShowIdentityVerificationModal(true)}
                    >
                      <FileText size={14} />
                      Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Account Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                {/* Account Status */}
                <div className={styles.infoCard}>
                  <Info size={20} className={styles.infoIcon} style={{ 
                    color: accountStatus.isAccountLocked ? 'var(--danger)' : 'var(--success)' 
                  }} />
                  <div style={{ flex: 1 }}>
                    <p className={styles.infoText}>
                      <span style={{ fontWeight: '600' }}>Account Status:</span>{' '}
                      <span style={{ 
                        color: accountStatus.isAccountLocked ? 'var(--danger)' : 'var(--success)',
                        fontWeight: '600'
                      }}>
                        {accountStatus.isAccountLocked ? 'Locked' : 'Active'}
                      </span>
                    </p>
                    {accountStatus.isAccountLocked && accountStatus.lockoutEnd && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--danger)', margin: '4px 0 0 0' }}>
                        Locked until {formatDate(accountStatus.lockoutEnd)}
                      </p>
                    )}
                    {accountStatus.failedLoginAttempts > 0 && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--warning)', margin: '4px 0 0 0' }}>
                        Failed login attempts: {accountStatus.failedLoginAttempts}/5
                      </p>
                    )}
                  </div>
                </div>

                {/* Last Login */}
                <div className={styles.infoCard}>
                  <LogIn size={20} className={styles.infoIcon} />
                  <div style={{ flex: 1 }}>
                    <p className={styles.infoText}>
                      <span style={{ fontWeight: '600' }}>Last Login:</span>{' '}
                      {formatDate(accountStatus.lastLoginAt)}
                    </p>
                    {accountStatus.lastLoginAt && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {new Date(accountStatus.lastLoginAt).toLocaleDateString() === new Date().toLocaleDateString() 
                          ? 'Today' 
                          : `${Math.floor((new Date().getTime() - new Date(accountStatus.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Created */}
                <div className={styles.infoCard}>
                  <Calendar size={20} className={styles.infoIcon} />
                  <div style={{ flex: 1 }}>
                    <p className={styles.infoText}>
                      <span style={{ fontWeight: '600' }}>Member Since:</span>{' '}
                      {formatDate(accountStatus.createdAt)}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      {Math.floor((new Date().getTime() - new Date(accountStatus.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                </div>

                {/* Profile Completeness */}
                {profileCompletion && (
                  <div className={styles.infoCard}>
                    <UserIcon size={20} className={styles.infoIcon} />
                    <div style={{ flex: 1 }}>
                      <p className={styles.infoText}>
                        <span style={{ fontWeight: '600' }}>Profile Completion:</span>{' '}
                        <span style={{ 
                          color: profileCompletion.completionPercentage >= 80 ? 'var(--success)' : 
                                profileCompletion.completionPercentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                          fontWeight: '600'
                        }}>
                          {profileCompletion.completionPercentage}%
                        </span>
                      </p>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        borderRadius: '3px', 
                        marginTop: 'var(--spacing-xs)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${profileCompletion.completionPercentage}%`,
                          height: '100%',
                          background: profileCompletion.completionPercentage >= 80 ? 'var(--success)' : 
                                    profileCompletion.completionPercentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Recommendations */}
              {(!profile?.isEmailVerified || !profile?.twoFactorEnabled || !profile?.isPhoneVerified) && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
                      <AlertTriangle size={20} style={{ color: 'var(--warning)', marginTop: '2px' }} />
                      <div>
                        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--warning)', fontSize: '1rem' }}>
                          Security Recommendations
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                          {!profile?.isEmailVerified && (
                            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Verify your email address</li>
                          )}
                          {!profile?.isPhoneVerified && (
                            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Add and verify your phone number</li>
                          )}
                          {!profile?.twoFactorEnabled && (
                            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Enable two-factor authentication</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              <Shield size={24} /> Enable Two-Factor Authentication
            </h3>
            
            {isEnabling2FA ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                <RefreshCw size={24} className="animate-spin" />
                <p>Setting up 2FA...</p>
              </div>
            ) : (
              <>
                <p className={styles.modalDescription}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the verification code below.
                </p>
                
                {qrCode && (
                  <div style={{ textAlign: 'center', margin: 'var(--spacing-lg) 0' }}>
                    <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="twoFactorCode" className={styles.formLabel}>Verification Code</label>
                  <input
                    id="twoFactorCode"
                    type="text"
                    className={styles.formInput}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                
                {twoFactorError && (
                  <div className={styles.messageError}>
                    <XCircle size={18} /> {twoFactorError}
                  </div>
                )}
                
                <div className={styles.modalActions}>
                  <button onClick={() => setShowTwoFactorModal(false)} className={styles.modalCancelButton}>
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirm2FA} 
                    className={styles.modalConfirmButton}
                    disabled={twoFactorCode.length !== 6}
                  >
                    Enable 2FA
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Identity Verification Modal */}
      {showIdentityVerificationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              <FileText size={24} /> Identity Verification
            </h3>
            <p className={styles.modalDescription}>
              Upload your government-issued ID and a selfie for identity verification. This helps keep our platform secure.
            </p>
            
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ID Front (Required)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdentityFiles(prev => ({ ...prev, frontId: e.target.files?.[0] }))}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ID Back (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdentityFiles(prev => ({ ...prev, backId: e.target.files?.[0] }))}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Selfie (Required)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdentityFiles(prev => ({ ...prev, selfie: e.target.files?.[0] }))}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button onClick={() => setShowIdentityVerificationModal(false)} className={styles.modalCancelButton}>
                Cancel
              </button>
              <button 
                onClick={handleIdentityVerification} 
                className={styles.modalConfirmButton}
                disabled={!identityFiles.frontId || !identityFiles.selfie || isUploadingIdentity}
              >
                {isUploadingIdentity ? 'Uploading...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Error/Success Messages */}
      {error && (
        <div className={styles.messageError} style={{ 
          position: 'sticky', 
          top: '0', 
          zIndex: 100, 
          marginBottom: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <XCircle size={18} />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{ 
                marginLeft: 'auto', 
                background: 'none', 
                border: 'none', 
                color: 'var(--danger)', 
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className={styles.messageSuccess} style={{ 
          position: 'sticky', 
          top: '0', 
          zIndex: 100, 
          marginBottom: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <CheckCircle size={18} />
            <span>{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              style={{ 
                marginLeft: 'auto', 
                background: 'none', 
                border: 'none', 
                color: 'var(--success)', 
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}