import { useState, useEffect } from 'react';
import axios from '../api/axios';

interface AvailabilityResponse {
  isUsernameAvailable: boolean;
  isEmailAvailable: boolean;
  usernameMessage?: string;
  emailMessage?: string;
}

export const useAvailabilityCheck = (username: string, email: string) => {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!username && !email) {
        setAvailability(null);
        return;
      }

      // Only check if username is at least 3 chars or email looks like email
      if (username && username.length < 3) return;
      if (email && !email.includes('@')) return;

      setLoading(true);
      try {
        const response = await axios.post('/Auth/check-availability', {
          username: username || undefined,
          email: email || undefined
        });
        setAvailability(response.data);
      } catch (error) {
        console.error('Availability check error:', error);
        setAvailability(null);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [username, email]);

  return { availability, loading };
};