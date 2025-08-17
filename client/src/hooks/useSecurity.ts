import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';

export const usePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const notification = useNotification();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    notification.clearNotification();
    
    if (newPassword !== confirmNewPassword) {
      notification.showError('New password and confirmation do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      notification.showError('New password must be at least 6 characters long.');
      return;
    }
    
    try {
      await axios.put('/user/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      
      notification.showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      notification.showError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    handleChangePassword,
    notification
  };
};

export const useTwoFactorAuth = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const notification = useNotification();

  const handleEnable2FA = async () => {
    setShowModal(true);
    setIsEnabling(true);
    setError(null);
    
    try {
      const response = await axios.post('/auth/enable-2fa');
      setQrCode(response.data.qrCode);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable 2FA.');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleConfirm2FA = async () => {
    setError(null);
    
    try {
      await axios.post('/auth/verify-2fa-setup', { code });
      notification.showSuccess('Two-factor authentication enabled successfully!');
      setShowModal(false);
      setCode('');
      setQrCode(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }
    
    try {
      await axios.post('/auth/disable-2fa');
      notification.showSuccess('Two-factor authentication disabled.');
    } catch (err: any) {
      notification.showError(err.response?.data?.message || 'Failed to disable 2FA.');
    }
  };

  return {
    showModal,
    setShowModal,
    isEnabling,
    qrCode,
    code,
    setCode,
    error,
    handleEnable2FA,
    handleConfirm2FA,
    handleDisable2FA,
    notification
  };
};

export const useEmailVerification = () => {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsResending(true);
    setMessage(null);
    setError(null);
    
    try {
      await axios.post('/auth/resend-verification');
      setMessage('Verification email sent successfully! Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return {
    isResending,
    message,
    error,
    handleResendVerification
  };
};

export const usePhoneVerification = () => {
  const [code, setCode] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendVerification = async (phoneNumber: string) => {
    setError(null);
    setSuccess(null);
    
    try {
      await axios.post('/user/send-phone-verification', { phoneNumber });
      setIsSent(true);
      setSuccess('Verification code sent to your phone!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    }
  };

  const handleVerifyPhone = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await axios.post('/user/verify-phone', { verificationCode: code });
      setSuccess('Phone number verified successfully!');
      setIsSent(false);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify phone number.');
    }
  };

  return {
    code,
    setCode,
    isSent,
    error,
    success,
    handleSendVerification,
    handleVerifyPhone
  };
};