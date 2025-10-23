/**
 * TypeScript Type Definitions
 * 
 * All data types used throughout the application
 * Makes your code type-safe and easier to understand
 */

// User data structure
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Grant data structure
export interface Grant {
  id: number;
  grantNumber: string;
  grantName: string;
  totalAmount: string | number;
  remainingAmount: string | number;
  studentBalance: string | number;
  travelBalance: string | number;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
}

// Spending request data structure
export interface SpendingRequest {
  id: number;
  amount: string | number;
  category: string;
  description: string;
  status: string;
  requestDate: string;
  reviewDate?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  grant?: Grant;
  userRole?: string;
  users?: Array<{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role?: string;
  }>;
}

// AI parsed data structure
export interface AiParsedData {
  category: 'travel' | 'students';
  amount: number;
  description: string;
  suggestedRules: number[];
  suggestedFringeRates: number[];
  warnings: string[];
  confidence: number;
  grant?: {
    id: number;
    name: string;
    number: string;
  };
}

// API response structures
export interface LoginResponse {
  token: string;
  user: User;
}

export interface GrantsResponse {
  grants: Grant[];
}

export interface SpendingRequestsResponse {
  requests: SpendingRequest[];
}

export interface AiParseResponse {
  parsed: AiParsedData;
}

export interface SpendingRequestCreateResponse {
  spendingRequest: SpendingRequest;
}

// API error response
export interface ApiError {
  error: string;
}