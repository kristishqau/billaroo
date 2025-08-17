import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { UserProfile, AccountStatus, SecuritySettings, ProfileCompletion } from '../types';

export const useProfileData = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all profile data in parallel
      const [profileRes, securityRes, completionRes] = await Promise.all([
        axios.get<UserProfile>('/user/profile'),
        axios.get<SecuritySettings>('/user/security-settings'),
        axios.get<ProfileCompletion>('/user/profile-completion')
      ]);

      setProfile(profileRes.data);
      setSecuritySettings(securityRes.data);
      setProfileCompletion(completionRes.data);

      // Create account status from profile data
      const accountStatusData: AccountStatus = {
        isActive: true,
        isEmailVerified: profileRes.data.isEmailVerified,
        isAccountLocked: false,
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

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  return {
    profile,
    accountStatus,
    securitySettings,
    profileCompletion,
    loading,
    error,
    refetchProfile: fetchProfileData,
    setProfile
  };
};