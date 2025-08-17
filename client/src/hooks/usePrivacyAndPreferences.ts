import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';
import type { UserProfile } from '../types';

export const usePrivacyAndPreferences = (profile: UserProfile | null) => {
  // Privacy settings
  const [showEmail, setShowEmail] = useState(profile?.showEmail || false);
  const [showPhone, setShowPhone] = useState(profile?.showPhone || false);
  const [showAddress, setShowAddress] = useState(profile?.showAddress || false);
  const [allowMessages, setAllowMessages] = useState(profile?.allowMessages || false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(profile?.emailNotifications ?? true);
  const [smsNotifications, setSmsNotifications] = useState(profile?.smsNotifications || false);
  const [marketingEmails, setMarketingEmails] = useState(profile?.marketingEmails || false);

  const privacyNotification = useNotification();
  const preferencesNotification = useNotification();

  const handlePrivacySettingsUpdate = async () => {
    try {
      await axios.put('/user/privacy-settings', {
        showEmail,
        showPhone,
        showAddress,
        allowMessages
      });
      privacyNotification.showSuccess('Privacy settings updated successfully!');
    } catch (err: any) {
      privacyNotification.showError(err.response?.data?.message || 'Failed to update privacy settings.');
    }
  };

  const handleNotificationPreferencesUpdate = async () => {
    try {
      await axios.put('/user/preferences', {
        emailNotifications,
        smsNotifications,
        marketingEmails,
        timeZone: profile?.timeZone || 'UTC'
      });
      preferencesNotification.showSuccess('Notification preferences updated successfully!');
    } catch (err: any) {
      preferencesNotification.showError(err.response?.data?.message || 'Failed to update notification preferences.');
    }
  };

  const initializeSettings = (profileData: UserProfile) => {
    setShowEmail(profileData.showEmail);
    setShowPhone(profileData.showPhone);
    setShowAddress(profileData.showAddress);
    setAllowMessages(profileData.allowMessages);
    setEmailNotifications(profileData.emailNotifications);
    setSmsNotifications(profileData.smsNotifications);
    setMarketingEmails(profileData.marketingEmails);
  };

  return {
    // Privacy settings
    showEmail,
    setShowEmail,
    showPhone,
    setShowPhone,
    showAddress,
    setShowAddress,
    allowMessages,
    setAllowMessages,
    
    // Notification preferences
    emailNotifications,
    setEmailNotifications,
    smsNotifications,
    setSmsNotifications,
    marketingEmails,
    setMarketingEmails,
    
    // Handlers
    handlePrivacySettingsUpdate,
    handleNotificationPreferencesUpdate,
    initializeSettings,
    
    // Notifications
    privacyNotification,
    preferencesNotification
  };
};