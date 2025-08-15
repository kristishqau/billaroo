import { useState, useEffect } from 'react';
import axios from '../api/axios';

interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  requirements: string[];
  violations: string[];
  score: number;
}

export function usePasswordValidation(password: string, delay: number = 300) {
  const [validation, setValidation] = useState<PasswordValidation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validatePassword = async () => {
      if (!password || password.length < 6) {
        setValidation(null);
        return;
      }

      setLoading(true);
      
      try {
        const response = await axios.post('/Auth/validate-password', { password });
        setValidation(response.data);
      } catch (error) {
        console.error('Password validation failed:', error);
        // Fallback to basic client-side validation
        const basicValidation: PasswordValidation = {
          isValid: password.length >= 6,
          strength: password.length < 8 ? 'weak' : password.length < 12 ? 'medium' : 'strong',
          requirements: [],
          violations: password.length < 6 ? ['Password must be at least 6 characters'] : [],
          score: Math.min(password.length * 10, 100)
        };
        setValidation(basicValidation);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(validatePassword, delay);
    return () => clearTimeout(timeoutId);
  }, [password, delay]);

  return { validation, loading };
}