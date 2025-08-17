import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';

export const useFileUpload = () => {
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  
  const profileImageNotification = useNotification();
  const cvNotification = useNotification();

  const handleProfileImageUpload = async (file: File, onSuccess?: () => void) => {
    profileImageNotification.clearNotification();

    // Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      profileImageNotification.showError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      profileImageNotification.showError('Image size must be less than 5MB. Please choose a smaller file.');
      return;
    }

    setUploadingProfileImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/user/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      profileImageNotification.showSuccess(
        response.data?.message || 'Profile image uploaded successfully!'
      );
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          'Failed to upload profile image. Please try again.';
      profileImageNotification.showError(errorMessage);
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleCvUpload = async (file: File) => {
    cvNotification.clearNotification();

    // Validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      cvNotification.showError('Please upload a valid CV file (PDF, DOC, or DOCX)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      cvNotification.showError('CV file size must be less than 10MB. Please choose a smaller file.');
      return;
    }

    setUploadingCv(true);
    const formData = new FormData();
    formData.append('cvFile', file);

    try {
      const response = await axios.post('/user/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      cvNotification.showSuccess(
        response.data?.message || 'CV uploaded successfully!'
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          'Failed to upload CV. Please try again.';
      cvNotification.showError(errorMessage);
    } finally {
      setUploadingCv(false);
    }
  };

  return {
    uploadingProfileImage,
    uploadingCv,
    handleProfileImageUpload,
    handleCvUpload,
    profileImageNotification,
    cvNotification
  };
};