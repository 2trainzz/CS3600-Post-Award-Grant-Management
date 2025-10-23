//application Constants - centralized configuration values

// API Base URL - change this for different environments
export const API_BASE = 'http://localhost:3001/api';

// View names for navigation
export const VIEWS = {
  LOGIN: 'login',
  GRANTS: 'grants',
  CREATE: 'create',
  REQUESTS: 'requests',
} as const;

// Request categories
export const CATEGORIES = {
  TRAVEL: 'travel',
  STUDENTS: 'students',
} as const;

// Request statuses
export const STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

// Status color mapping for badges
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
};