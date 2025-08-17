import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';

export const useIdentityVerification = () => {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [identityFiles, setIdentityFiles] = useState<{
    frontId?: File;
    backId?: File;
    selfie?: File;
  }>({});

  const notification = useNotification();

  const handleIdentityVerification = async () => {
    if (!identityFiles.frontId || !identityFiles.selfie) {
      notification.showError('Please upload at least your ID front and a selfie.');
      return;
    }

    setIsUploading(true);
    notification.clearNotification();
    
    const formData = new FormData();
    if (identityFiles.frontId) formData.append('frontId', identityFiles.frontId);
    if (identityFiles.backId) formData.append('backId', identityFiles.backId);
    if (identityFiles.selfie) formData.append('selfie', identityFiles.selfie);

    try {
      await axios.post('/user/verify-identity', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      notification.showSuccess('Identity verification documents uploaded successfully! We will review them within 1-2 business days.');
      setShowModal(false);
      setIdentityFiles({});
    } catch (err: any) {
      notification.showError(err.response?.data?.message || 'Failed to upload identity verification documents.');
    } finally {
      setIsUploading(false);
    }
  };

  const updateIdentityFile = (type: 'frontId' | 'backId' | 'selfie', file?: File) => {
    setIdentityFiles(prev => ({ ...prev, [type]: file }));
  };

  return {
    showModal,
    setShowModal,
    isUploading,
    identityFiles,
    updateIdentityFile,
    handleIdentityVerification,
    notification
  };
};