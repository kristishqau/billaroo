import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';
import type { UserProfile } from '../types';

interface ProfileFormData {
  // Basic profile
  username: string;
  email: string;
  
  // Personal info
  firstName: string;
  lastName: string;
  bio: string;
  
  // Professional info
  jobTitle: string;
  company: string;
  website: string;
  linkedInUrl: string;
  gitHubUrl: string;
  portfolioUrl: string;
  
  // Contact info
  phoneNumber: string;
  city: string;
  country: string;
}

export const useProfileForms = (profile: UserProfile | null, onSuccess: (updatedProfile: UserProfile) => void) => {
  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingProfessionalInfo, setIsEditingProfessionalInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<ProfileFormData>({
    username: profile?.username || '',
    email: profile?.email || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    bio: profile?.bio || '',
    jobTitle: profile?.jobTitle || '',
    company: profile?.company || '',
    website: profile?.website || '',
    linkedInUrl: profile?.linkedInUrl || '',
    gitHubUrl: profile?.gitHubUrl || '',
    portfolioUrl: profile?.portfolioUrl || '',
    phoneNumber: profile?.phoneNumber || '',
    city: profile?.city || '',
    country: profile?.country || ''
  });

  // Notifications
  const profileNotification = useNotification();
  const personalNotification = useNotification();
  const professionalNotification = useNotification();
  const contactNotification = useNotification();

  // Initialize form data when profile changes
  const initializeFormData = (profileData: UserProfile) => {
    setFormData({
      username: profileData.username,
      email: profileData.email,
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      bio: profileData.bio || '',
      jobTitle: profileData.jobTitle || '',
      company: profileData.company || '',
      website: profileData.website || '',
      linkedInUrl: profileData.linkedInUrl || '',
      gitHubUrl: profileData.gitHubUrl || '',
      portfolioUrl: profileData.portfolioUrl || '',
      phoneNumber: profileData.phoneNumber || '',
      city: profileData.city || '',
      country: profileData.country || ''
    });
  };

  // Update form field
  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    profileNotification.clearNotification();
    
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        username: formData.username,
        email: formData.email
      });
      
      onSuccess(res.data);
      profileNotification.showSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (err: any) {
      profileNotification.showError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Personal info update handler
  const handlePersonalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    personalNotification.clearNotification();
    
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio
      });
      
      onSuccess(res.data);
      personalNotification.showSuccess('Personal information updated successfully!');
      setIsEditingPersonalInfo(false);
    } catch (err: any) {
      personalNotification.showError(err.response?.data?.message || 'Failed to update personal information.');
    }
  };

  // Professional info update handler
  const handleProfessionalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    professionalNotification.clearNotification();
    
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        jobTitle: formData.jobTitle,
        company: formData.company,
        website: formData.website,
        linkedInUrl: formData.linkedInUrl,
        gitHubUrl: formData.gitHubUrl,
        portfolioUrl: formData.portfolioUrl
      });
      
      onSuccess(res.data);
      professionalNotification.showSuccess('Professional information updated successfully!');
      setIsEditingProfessionalInfo(false);
    } catch (err: any) {
      professionalNotification.showError(err.response?.data?.message || 'Failed to update professional information.');
    }
  };

  // Contact info update handler
  const handleContactInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    contactNotification.clearNotification();
    
    try {
      const res = await axios.put<UserProfile>('/user/profile', {
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        country: formData.country
      });
      
      onSuccess(res.data);
      contactNotification.showSuccess('Contact information updated successfully!');
      setIsEditingContactInfo(false);
    } catch (err: any) {
      contactNotification.showError(err.response?.data?.message || 'Failed to update contact information.');
    }
  };

  return {
    // States
    isEditingProfile,
    isEditingPersonalInfo,
    isEditingProfessionalInfo,
    isEditingContactInfo,
    formData,
    
    // Setters
    setIsEditingProfile,
    setIsEditingPersonalInfo,
    setIsEditingProfessionalInfo,
    setIsEditingContactInfo,
    updateField,
    initializeFormData,
    
    // Handlers
    handleProfileUpdate,
    handlePersonalInfoUpdate,
    handleProfessionalInfoUpdate,
    handleContactInfoUpdate,
    
    // Notifications
    profileNotification,
    personalNotification,
    professionalNotification,
    contactNotification
  };
};