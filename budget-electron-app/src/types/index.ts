export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'approver';
  department: string;
}

export interface Grant {
  id: number;
  grantNumber: string;
  grantName: string;
  totalAmount: number;
  remainingAmount: number;
  studentBalance: number;
  travelBalance: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'suspended';
  description?: string;
}

export interface SpendingRequest {
  id: number;
  amount: number;
  category: 'travel' | 'students';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestDate: string;
  reviewDate?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  grant?: Grant;
  userRole?: string;
}

export interface AiParsedData {
  category: 'travel' | 'students';
  amount: number;
  description: string;
  suggestedRules: number[];
  suggestedFringeRates: number[];
  warnings: string[];
  confidence: number;
}