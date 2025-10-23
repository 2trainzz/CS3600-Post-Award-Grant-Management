/**
 * useGrants Hook
 * 
 * Extracted from App.tsx - handles grants data fetching
 * Same logic, just organized into a reusable hook
 */

import { useState } from 'react';
import { fetchGrants } from '../services/api';
import type { Grant } from '../types';

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  /**
   * Load grants from API
   * (Same logic as your fetchGrants in App.tsx)
   */
  const loadGrants = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchGrants(token);
      setGrants(data.grants || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grants');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => setError('');

  return {
    grants,
    loading,
    error,
    loadGrants,
    clearError,
  };
}