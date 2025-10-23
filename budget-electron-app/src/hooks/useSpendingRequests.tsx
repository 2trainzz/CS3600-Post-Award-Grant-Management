//useSpendingRequests Hook - handles spending requests data and AI parsing

import { useState } from 'react';
import { 
  fetchSpendingRequests, 
  createSpendingRequest,
  parseSpendingRequestWithAI 
} from '../services/api';
import type { SpendingRequest, AiParsedData } from '../types';

export function useSpendingRequests() {
  const [requests, setRequests] = useState<SpendingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  //AI parsing state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiParsedData, setAiParsedData] = useState<AiParsedData | null>(null);

  //load spending requests from API
  const loadRequests = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchSpendingRequests(token);
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch spending requests');
    } finally {
      setLoading(false);
    }
  };

  //create new spending request
  const createRequest = async (
    token: string,
    requestData: {
      grantId: number;
      amount: number;
      category: string;
      description: string;
    }
  ): Promise<boolean> => {
    setError('');

    try {
      await createSpendingRequest(token, requestData);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create spending request');
      return false;
    }
  };

  //parse request with AI
  const parseWithAI = async (
    token: string,
    grantId: number,
    userMessage: string
  ): Promise<AiParsedData | null> => {
    if (!userMessage.trim() || !grantId) {
      setError('Please select a grant and enter a request');
      return null;
    }

    setAiLoading(true);
    setError('');

    try {
      const data = await parseSpendingRequestWithAI(token, grantId, userMessage);
      setAiParsedData(data.parsed);
      return data.parsed;
    } catch (err: any) {
      setError(err.message || 'Failed to parse request with AI');
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  //clear AI parsed data
  const clearAiData = () => {
    setAiParsedData(null);
  };

  //clear err message
  const clearError = () => setError('');

  return {
    requests,
    loading,
    error,
    aiLoading,
    aiParsedData,
    loadRequests,
    createRequest,
    parseWithAI,
    clearAiData,
    clearError,
  };
}