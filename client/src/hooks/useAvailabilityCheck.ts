import { useState, useEffect } from 'react';
import axios from '../api/axios';

interface AvailabilityResponse {
  isUsernameAvailable?: boolean;
  isEmailAvailable?: boolean;
  usernameMessage?: string;
  emailMessage?: string;
}

export function useAvailabilityCheck(username: string, email: string, delay: number = 500) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!username && !email) {
        setAvailability(null);
        return;
      }

      if (username && username.length < 3 && email && email.length < 3) {
        return;
      }

      setLoading(true);
      
      try {
        const response = await axios.post('/Auth/check-availability', {
          username: username.length >= 3 ? username : undefined,
          email: email.includes('@') && email.length > 3 ? email : undefined
        });
        
        setAvailability(response.data);
      } catch (error) {
        console.error('Availability check failed:', error);
        setAvailability(null);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, delay);
    return () => clearTimeout(timeoutId);
  }, [username, email, delay]);

  return { availability, loading };
}