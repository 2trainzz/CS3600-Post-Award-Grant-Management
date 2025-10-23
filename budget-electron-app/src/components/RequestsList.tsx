//RequestsList Component - displays the spending requests view

import type { SpendingRequest } from '../types';
import { STATUS_COLORS } from '../config/constants';

interface RequestsListProps {
  requests: SpendingRequest[];
}

export function RequestsList({ requests }: RequestsListProps) {
  if (requests.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Spending Requests</h2>
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No spending requests yet. Create one to get started!
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Spending Requests</h2>
      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {request.category}
                </h3>
                {request.grant && (
                  <p className="text-sm text-gray-500">
                    {request.grant.grantName} ({request.grant.grantNumber})
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  ${parseFloat(request.amount.toString()).toLocaleString()}
                </div>
                <span 
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">{request.description}</p>
            
            {/* Metadata */}
            <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
              <div>
                Requested: {new Date(request.requestDate).toLocaleString()}
              </div>
              {request.reviewDate && (
                <div>
                  Reviewed: {new Date(request.reviewDate).toLocaleString()}
                </div>
              )}
              {request.reviewNotes && (
                <div className="mt-2 text-gray-700">
                  <strong>Review Notes:</strong> {request.reviewNotes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}