import { useEffect } from 'react'
import styles from './Profile.module.css'
import Navbar from '../../components/Navbar/Navbar'
import { RefreshCw, XCircle } from 'lucide-react'
import Notification from '../../components/Notification/Notification'
import { useNotification } from '../../hooks/useNotification'

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

export default function Profile() {
  const showNotification = useNotification()

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

  // Skills management hook
  const skillsManagement = useSkillsManagement(profile?.skills || [])

  // Privacy and preferences hook
  const privacyAndPreferences = usePrivacyAndPreferences(profile)

  // Account management hook
  const accountManagement = useAccountManagement()

  // Identity verification hook
  const identityVerification = useIdentityVerification()

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      profileForms.initializeFormData(profile)
      skillsManagement.updateSkills(profile.skills || [])
      privacyAndPreferences.initializeSettings(profile)
    }
  }, [profile])

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

  // Handle CV upload
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await fileUpload.handleCvUpload(file)
    e.target.value = ''
  }

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
        />

        {/* Personal Information Section */}
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

        {/* Profile Information Section */}
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

        {/* Professional Information Section */}
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
        />

        {/* Contact Information Section */}
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
            error: phoneVerification.error,
            success: phoneVerification.success,
            handleSendVerification: phoneVerification.handleSendVerification,
            handleVerifyPhone: phoneVerification.handleVerifyPhone
          }}
          notification={profileForms.contactNotification}
        />

        {/* Skills Section */}
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

        {/* CV/Resume Section */}
        <CVSection
          profile={profile}
          formatDate={formatDate}
          onCvUpload={handleCvUpload}
          uploading={fileUpload.uploadingCv}
          notification={fileUpload.cvNotification}
        />

        {/* Privacy Settings Section */}
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

        {/* Notification Preferences Section */}
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

        {/* Change Password Section */}
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

        {/* Account Status Section */}
        <AccountStatusSection
          profile={profile}
          accountStatus={accountStatus}
          securitySettings={securitySettings}
          profileCompletion={profileCompletion}
          formatDate={formatDate}
          emailVerification={{
            isResending: emailVerification.isResending,
            message: emailVerification.message,
            error: emailVerification.error,
            handleResendVerification: emailVerification.handleResendVerification
          }}
          onEnable2FA={twoFactorAuth.handleEnable2FA}
          onDisable2FA={twoFactorAuth.handleDisable2FA}
          onIdentityVerification={() => identityVerification.setShowModal(true)}
        />

        {/* Account Management Section */}
        <AccountManagementSection
          onExportData={accountManagement.handleExportData}
          onDeleteAccount={() => accountManagement.setShowDeleteModal(true)}
          notification={accountManagement.notification}
        />

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