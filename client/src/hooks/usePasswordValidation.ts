import { useState, useEffect } from 'react';
import axios from '../api/axios';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordValidation {
  isValid: boolean;
  strength: PasswordStrength;
  requirements: string[];
  violations: string[];
  score: number;
}

export const usePasswordValidation = (password: string) => {
  const [validation, setValidation] = useState<PasswordValidation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validatePassword = async () => {
      if (!password) {
        setValidation(null);
        return;
      }

      if (password.length < 3) {
        // Don't make API call for very short passwords
        setValidation({
          isValid: false,
          strength: 'weak',
          requirements: [],
          violations: ['Password is too short'],
          score: 0
        });
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post('/Auth/validate-password', { password });
        setValidation(response.data);
      } catch (error) {
        console.error('Password validation error:', error);
        // Fallback to client-side validation
        const clientValidation = validatePasswordClient(password);
        setValidation(clientValidation);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(validatePassword, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [password]);

  return { validation, loading };
};

// Fallback client-side validation
const validatePasswordClient = (password: string): PasswordValidation => {
  const violations: string[] = [];
  let score = 0;

  if (password.length < 6) {
    violations.push('Password must be at least 6 characters long');
  } else if (password.length >= 8) {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    violations.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    violations.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    violations.push('Password must contain at least one number');
  } else {
    score++;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    violations.push('Password must contain at least one special character');
  } else {
    score++;
  }

  let strength: PasswordStrength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  return {
    isValid: violations.length === 0,
    strength,
    requirements: [
      'At least 6 characters long',
      'Contains at least one uppercase letter',
      'Contains at least one lowercase letter', 
      'Contains at least one number',
      'Contains at least one special character'
    ],
    violations,
    score
  };
};