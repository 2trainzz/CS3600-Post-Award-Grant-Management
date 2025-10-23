/**
 * API Service
 * 
 * All API calls in one place - extracted from App.tsx
 * Same fetch logic, just organized
 */

import { API_BASE } from '../config/constants';
import type {
  LoginResponse,
  GrantsResponse,
  SpendingRequestsResponse,
  SpendingRequestCreateResponse,
  AiParseResponse,
} from '../types';

/**
 * Helper to get auth headers
 */
function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

/**
 * Logout user
 */
export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
}

// ============================================================================
// GRANTS
// ============================================================================

/**
 * Fetch user's grants
 */
export async function fetchGrants(token: string): Promise<GrantsResponse> {
  const res = await fetch(`${API_BASE}/grants`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch grants');
  }

  return data;
}

// ============================================================================
// SPENDING REQUESTS
// ============================================================================

/**
 * Fetch user's spending requests
 */
export async function fetchSpendingRequests(token: string): Promise<SpendingRequestsResponse> {
  const res = await fetch(`${API_BASE}/spending-requests`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch spending requests');
  }

  return data;
}

/**
 * Create a new spending request
 */
export async function createSpendingRequest(
  token: string,
  requestData: {
    grantId: number;
    amount: number;
    category: string;
    description: string;
  }
): Promise<SpendingRequestCreateResponse> {
  const res = await fetch(`${API_BASE}/spending-requests`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(requestData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create spending request');
  }

  return data;
}

// ============================================================================
// AI PARSING
// ============================================================================

/**
 * Parse spending request with AI
 * 
 * NOTE: Endpoint changed from /spending-requests/ai-parse
 * to /ai/parse-spending-request
 */
export async function parseSpendingRequestWithAI(
  token: string,
  grantId: number,
  userMessage: string
): Promise<AiParseResponse> {
  const res = await fetch(`${API_BASE}/ai/parse-spending-request`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ grantId, userMessage }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to parse request with AI');
  }

  return data;
}