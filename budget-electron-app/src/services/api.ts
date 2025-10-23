//apiService - all API calls

import { API_BASE } from '../config/constants';
import type {
  LoginResponse,
  GrantsResponse,
  SpendingRequestsResponse,
  SpendingRequestCreateResponse,
  AiParseResponse,
} from '../types';

///helper fn - get auth headers
function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

//login user
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

//logout user
export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
}

// ============================================================================
// GRANTS
// ============================================================================

//get user grants
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

//get user spend requests
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

//create new spending request
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

//parse spending request with AI
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