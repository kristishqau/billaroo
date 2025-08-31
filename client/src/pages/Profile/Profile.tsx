import { useEffect, useState } from 'react'
import styles from './Profile.module.css'
import Navbar from '../../components/Navbar/Navbar'
import { RefreshCw, XCircle, User, Shield, Settings, FileText, Award } from 'lucide-react'
import Notification from '../../components/Notification/Notification'
import { useNotification } from '../../hooks/useNotification'
import { useAuth } from '../../context/AuthContext'

// Hook imports
import { useProfileData } from '../../hooks/useProfileData'
import { useProfileForms } from '../../hooks/useProfileForms'
import { usePasswordChange, useTwoFactorAuth, useEmailVerification, usePhoneVerification } from '../../hooks/useSecurity'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useSkillsManagement } from '../../hooks/useSkillsManagement'
import { usePrivacyAndPreferences } from '../../hooks/usePrivacyAndPreferences'
import { useAccountManagement } from '../../hooks/useAccountManagement'
import { useIdentityVerification } from '../../hooks/useIdentityVerification'

// Component imports
import ProfileHeader from '../../components/Profile/ProfileHeader'
import PersonalInfoSection from '../../components/Profile/PersonalInfoSection'
import ProfileInfoSection from '../../components/Profile/ProfileInfoSection'
import ProfessionalInfoSection from '../../components/Profile/ProfessionalInfoSection'
import ContactInfoSection from '../../components/Profile/ContactInfoSection'
import SkillsSection from '../../components/Profile/SkillsSection'
import CVSection from '../../components/Profile/CVSection'
import PrivacySettingsSection from '../../components/Profile/PrivacySettingsSection'
import NotificationPreferencesSection from '../../components/Profile/NotificationPreferencesSection'
import PasswordChangeSection from '../../components/Profile/PasswordChangeSection'
import AccountStatusSection from '../../components/Profile/AccountStatusSection'
import AccountManagementSection from '../../components/Profile/AccountManagementSection'
import DeleteAccountModal from '../../components/Profile/DeleteAccountModal'
import TwoFactorAuthModal from '../../components/Profile/TwoFactorAuthModal'
import IdentityVerificationModal from '../../components/Profile/IdentityVerificationModal'

type TabType = 'profile' | 'security' | 'preferences' | 'professional' | 'documents'

export default function Profile() {
  const { user } = useAuth() // Get the current user to check role
  const showNotification = useNotification()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Check if user is client
  const isClient = user?.role === 'client'

  // Core profile data
  const {
    profile,
    accountStatus,
    securitySettings,
    profileCompletion,
    loading,
    error,
    refetchProfile,
    setProfile
  } = useProfileData()

  // Profile forms management
  const profileForms = useProfileForms(profile, (updatedProfile) => {
    setProfile(updatedProfile)
  })

  // Security hooks
  const passwordChange = usePasswordChange()
  const twoFactorAuth = useTwoFactorAuth()
  const emailVerification = useEmailVerification()
  const phoneVerification = usePhoneVerification()

  // File upload hook
  const fileUpload = useFileUpload()

  // Skills management hook (only for freelancers)
  const skillsManagement = useSkillsManagement(profile?.skills || [])

  // Privacy and preferences hook
  const privacyAndPreferences = usePrivacyAndPreferences(profile) // Pass refetchProfile

  // Account management hook
  const accountManagement = useAccountManagement()

  // Identity verification hook
  const identityVerification = useIdentityVerification()

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      profileForms.initializeFormData(profile)
      if (!isClient) {
        skillsManagement.updateSkills(profile.skills || [])
      }
      privacyAndPreferences.initializeSettings(profile)
    }
  }, [profile, isClient])

  /**
   * Formats a date string into a more readable format.
   * @param dateString The date string to format.
   * @returns Formatted date string or 'N/A' if null.
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle CV upload (only for freelancers)
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isClient) return // Prevent clients from uploading CV
    
    const file = e.target.files?.[0]
    if (!file) return

    await fileUpload.handleCvUpload(file)
    e.target.value = ''
  }

  // Define tabs based on user role
  const getTabsForRole = () => {
    const baseTabs = [
      { id: 'profile' as TabType, label: 'Profile', icon: User },
      { id: 'security' as TabType, label: 'Security', icon: Shield },
      { id: 'preferences' as TabType, label: 'Preferences', icon: Settings },
    ]

    // Only add professional and documents tabs for freelancers
    if (!isClient) {
      baseTabs.splice(1, 0, { id: 'professional' as TabType, label: 'Professional', icon: Award })
      baseTabs.push({ id: 'documents' as TabType, label: 'Documents', icon: FileText })
    }

    return baseTabs
  }

  const tabs = getTabsForRole()

  // Adjust active tab if client tries to access restricted tabs
  useEffect(() => {
    if (isClient && (activeTab === 'professional' || activeTab === 'documents')) {
      setActiveTab('profile')
    }
  }, [isClient, activeTab])

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
    )
  }

  // Display error state
  if (error) {
    return (
      <div className={styles.profileContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.profileContent}>
          <div className={styles.messageError}>
            <XCircle size={18} /> {error}
            <button onClick={refetchProfile} className={styles.exportButton}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.profileContainer}>
      <Navbar variant="dashboard" />
      <div className={styles.profileContent}>
        
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          profileCompletion={profileCompletion}
          onImageUpload={(e) => fileUpload.handleProfileImageUpload(e.target.files?.[0]!, refetchProfile)}
          uploading={fileUpload.uploadingProfileImage}
          notification={fileUpload.profileImageNotification}
          isClient={isClient}
          privacySettings={{
            showEmail: privacyAndPreferences.showEmail,
            showPhone: privacyAndPreferences.showPhone,
            showAddress: privacyAndPreferences.showAddress
          }}
        />

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              >
                <div className={styles.tabButtonContent}>
                  <div className={styles.tabButtonHeader}>
                    <IconComponent size={20} />
                    <span className={styles.tabButtonLabel}>{tab.label}</span>
                  </div>
                </div>
                {isActive && <div className={styles.tabIndicator} />}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'profile' && (
            <div className={styles.tabPanel}>
              <PersonalInfoSection
                profile={profile}
                isEditing={profileForms.isEditingPersonalInfo}
                setIsEditing={profileForms.setIsEditingPersonalInfo}
                formData={{
                  firstName: profileForms.formData.firstName,
                  lastName: profileForms.formData.lastName,
                  bio: profileForms.formData.bio
                }}
                updateField={profileForms.updateField}
                onSubmit={profileForms.handlePersonalInfoUpdate}
                notification={profileForms.personalNotification}
              />

              <ProfileInfoSection
                profile={profile}
                isEditing={profileForms.isEditingProfile}
                setIsEditing={profileForms.setIsEditingProfile}
                formData={{
                  username: profileForms.formData.username,
                  email: profileForms.formData.email
                }}
                updateField={profileForms.updateField}
                onSubmit={profileForms.handleProfileUpdate}
                notification={profileForms.profileNotification}
              />

              <ContactInfoSection
                profile={profile}
                isEditing={profileForms.isEditingContactInfo}
                setIsEditing={profileForms.setIsEditingContactInfo}
                formData={{
                  phoneNumber: profileForms.formData.phoneNumber,
                  city: profileForms.formData.city,
                  country: profileForms.formData.country
                }}
                updateField={profileForms.updateField}
                onSubmit={profileForms.handleContactInfoUpdate}
                phoneVerification={{
                  code: phoneVerification.code,
                  setCode: phoneVerification.setCode,
                  isSent: phoneVerification.isSent,
                  handleSendVerification: phoneVerification.handleSendVerification,
                  handleVerifyPhone: phoneVerification.handleVerifyPhone
                }}
                notification={profileForms.contactNotification}
                refetchProfile={refetchProfile}
              />
            </div>
          )}

          {activeTab === 'professional' && !isClient && (
            <div className={styles.tabPanel}>
              <ProfessionalInfoSection
                profile={profile}
                isEditing={profileForms.isEditingProfessionalInfo}
                setIsEditing={profileForms.setIsEditingProfessionalInfo}
                formData={{
                  jobTitle: profileForms.formData.jobTitle,
                  company: profileForms.formData.company,
                  website: profileForms.formData.website,
                  linkedInUrl: profileForms.formData.linkedInUrl,
                  gitHubUrl: profileForms.formData.gitHubUrl,
                  portfolioUrl: profileForms.formData.portfolioUrl
                }}
                updateField={profileForms.updateField}
                onSubmit={profileForms.handleProfessionalInfoUpdate}
                notification={profileForms.professionalNotification}
                isClient={isClient}
              />

              <SkillsSection
                skills={skillsManagement.skills}
                newSkillName={skillsManagement.newSkillName}
                setNewSkillName={skillsManagement.setNewSkillName}
                newSkillProficiency={skillsManagement.newSkillProficiency}
                setNewSkillProficiency={skillsManagement.setNewSkillProficiency}
                isAddingSkill={skillsManagement.isAddingSkill}
                onAddSkill={skillsManagement.handleAddSkill}
                onDeleteSkill={skillsManagement.handleDeleteSkill}
                notification={skillsManagement.notification}
              />
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.tabPanel}>
              <AccountStatusSection
                profile={profile}
                accountStatus={accountStatus}
                securitySettings={securitySettings}
                profileCompletion={profileCompletion}
                formatDate={formatDate}
                emailVerification={{
                  isResending: emailVerification.isResending,
                  handleResendVerification: emailVerification.handleResendVerification
                }}
                phoneVerification={{
                  code: phoneVerification.code,
                  setCode: phoneVerification.setCode,
                  isSent: phoneVerification.isSent,
                  handleSendVerification: phoneVerification.handleSendVerification,
                  handleVerifyPhone: phoneVerification.handleVerifyPhone
                }}
                onEnable2FA={twoFactorAuth.handleEnable2FA}
                onDisable2FA={twoFactorAuth.handleDisable2FA}
                onIdentityVerification={() => identityVerification.setShowModal(true)}
                refetchProfile={refetchProfile}
              />

              <PasswordChangeSection
                currentPassword={passwordChange.currentPassword}
                setCurrentPassword={passwordChange.setCurrentPassword}
                newPassword={passwordChange.newPassword}
                setNewPassword={passwordChange.setNewPassword}
                confirmNewPassword={passwordChange.confirmNewPassword}
                setConfirmNewPassword={passwordChange.setConfirmNewPassword}
                showCurrentPassword={passwordChange.showCurrentPassword}
                setShowCurrentPassword={passwordChange.setShowCurrentPassword}
                showNewPassword={passwordChange.showNewPassword}
                setShowNewPassword={passwordChange.setShowNewPassword}
                showConfirmNewPassword={passwordChange.showConfirmNewPassword}
                setShowConfirmNewPassword={passwordChange.setShowConfirmNewPassword}
                onSubmit={passwordChange.handleChangePassword}
                notification={passwordChange.notification}
              />

              <AccountManagementSection
                onExportData={accountManagement.handleExportData}
                onDeleteAccount={() => accountManagement.setShowDeleteModal(true)}
                notification={accountManagement.notification}
              />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.tabPanel}>
              <PrivacySettingsSection
                showEmail={privacyAndPreferences.showEmail}
                setShowEmail={privacyAndPreferences.setShowEmail}
                showPhone={privacyAndPreferences.showPhone}
                setShowPhone={privacyAndPreferences.setShowPhone}
                showAddress={privacyAndPreferences.showAddress}
                setShowAddress={privacyAndPreferences.setShowAddress}
                allowMessages={privacyAndPreferences.allowMessages}
                setAllowMessages={privacyAndPreferences.setAllowMessages}
                onUpdate={privacyAndPreferences.handlePrivacySettingsUpdate}
                notification={privacyAndPreferences.privacyNotification}
              />

              <NotificationPreferencesSection
                emailNotifications={privacyAndPreferences.emailNotifications}
                setEmailNotifications={privacyAndPreferences.setEmailNotifications}
                smsNotifications={privacyAndPreferences.smsNotifications}
                setSmsNotifications={privacyAndPreferences.setSmsNotifications}
                marketingEmails={privacyAndPreferences.marketingEmails}
                setMarketingEmails={privacyAndPreferences.setMarketingEmails}
                onUpdate={privacyAndPreferences.handleNotificationPreferencesUpdate}
                notification={privacyAndPreferences.preferencesNotification}
              />
            </div>
          )}

          {activeTab === 'documents' && !isClient && (
            <div className={styles.tabPanel}>
              <CVSection
                profile={profile}
                formatDate={formatDate}
                onCvUpload={handleCvUpload}
                uploading={fileUpload.uploadingCv}
                notification={fileUpload.cvNotification}
              />
            </div>
          )}
        </div>

        {/* Modals */}
        
        {/* Delete Account Modal */}
        <DeleteAccountModal
          show={accountManagement.showDeleteModal}
          onClose={() => {
            accountManagement.setShowDeleteModal(false)
            accountManagement.resetDeleteForm()
          }}
          deletePassword={accountManagement.deletePassword}
          setDeletePassword={accountManagement.setDeletePassword}
          deleteConfirmationText={accountManagement.deleteConfirmationText}
          setDeleteConfirmationText={accountManagement.setDeleteConfirmationText}
          deleteWarning={accountManagement.deleteWarning}
          unpaidInvoices={accountManagement.unpaidInvoices}
          activeProjects={accountManagement.activeProjects}
          canForceDelete={accountManagement.canForceDelete}
          requiresAcknowledgment={accountManagement.requiresAcknowledgment}
          forceDeleteChecked={accountManagement.forceDeleteChecked}
          setForceDeleteChecked={accountManagement.setForceDeleteChecked}
          acknowledgeDataLossChecked={accountManagement.acknowledgeDataLossChecked}
          setAcknowledgeDataLossChecked={accountManagement.setAcknowledgeDataLossChecked}
          formatDate={formatDate}
          onRequestDeletion={accountManagement.handleRequestDeletion}
          onDeleteAccount={accountManagement.handleDeleteAccount}
        />

        {/* Two-Factor Authentication Modal */}
        <TwoFactorAuthModal
          show={twoFactorAuth.showModal}
          onClose={() => twoFactorAuth.setShowModal(false)}
          isEnabling={twoFactorAuth.isEnabling}
          qrCode={twoFactorAuth.qrCode}
          code={twoFactorAuth.code}
          setCode={twoFactorAuth.setCode}
          error={twoFactorAuth.error}
          onConfirm={twoFactorAuth.handleConfirm2FA}
        />

        {/* Identity Verification Modal */}
        <IdentityVerificationModal
          show={identityVerification.showModal}
          onClose={() => identityVerification.setShowModal(false)}
          identityFiles={identityVerification.identityFiles}
          updateIdentityFile={identityVerification.updateIdentityFile}
          isUploading={identityVerification.isUploading}
          onSubmit={identityVerification.handleIdentityVerification}
          notification={identityVerification.notification}
        />
      </div>

      {/* Global Notification */}
      <Notification 
        notification={showNotification.notification}
        onClose={showNotification.clearNotification}
      />
    </div>
  )
}