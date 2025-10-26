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

// Status color mapping for badges - darker theme
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  approved: 'bg-green-900 text-green-300',
  rejected: 'bg-red-900 text-red-300',
  completed: 'bg-blue-900 text-blue-300',
  active: 'bg-green-900 text-green-300',
  closed: 'bg-gray-700 text-gray-300'
};