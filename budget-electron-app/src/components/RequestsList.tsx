//RequestsList Component - displays the spending requests view

import { useState } from 'react';
import type { SpendingRequest } from '../types';
import { STATUS_COLORS } from '../config/constants';
import { RequestReviewModal } from './RequestReview';

interface RequestsListProps {
  requests: SpendingRequest[];
  onApprove?: (requestId: number, reviewNotes: string) => void;
  onReject?: (requestId: number, reviewNotes: string) => void;
  userRole?: string;
}

export function RequestsList({ requests, onApprove, onReject, userRole }: RequestsListProps) {
  const [reviewingRequest, setReviewingRequest] = useState<SpendingRequest | null>(null);

  const handleApprove = (reviewNotes: string) => {
    if (reviewingRequest && onApprove) {
      onApprove(reviewingRequest.id, reviewNotes);
      setReviewingRequest(null);
    }
  };

  const handleReject = (reviewNotes: string) => {
    if (reviewingRequest && onReject) {
      onReject(reviewingRequest.id, reviewNotes);
      setReviewingRequest(null);
    }
  };
  
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">My Spending Requests</h2>
      
      {/* Grid layout */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {requests.length === 0 ? (
          // "No requests" styling
          <div className="col-span-full bg-dark-card rounded-lg shadow-lg border border-gray-700 p-8 text-center text-gray-400">
            No spending requests yet. Create one to get started!
          </div>
        ) : (
          requests.map((request) => (
            <div 
              key={request.id} 
              // Card styling 
              className="bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                {/* Text styling */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white capitalize truncate">{request.category}</h3>
                  {request.grant && (
                    <p className="text-sm text-gray-400 truncate">
                      {request.grant.grantName} ({request.grant.grantNumber})
                    </p>
                  )}
                </div>
                {/* Layout and text styling */}
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="text-xl font-bold text-white whitespace-nowrap">
                    ${parseFloat(request.amount.toString()).toLocaleString()}
                  </div>
                  <span 
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[request.status] || 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-3 flex-grow">{request.description}</p>
              
              {/* Action Buttons for Pending Requests */}
              {userRole === 'admin' && request.status === 'pending' && onApprove && onReject && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setReviewingRequest(request)}
                    className="flex-1 bg-accent text-darkblue py-2 px-4 rounded-md hover:bg-[#52e0c4] transition-colors text-sm font-semibold"
                  >
                    Review Request
                  </button>
                </div>
              )}
              
              {/* Metadata styling */}
              <div className="text-xs text-gray-400 border-t border-gray-700 pt-3 space-y-1 mt-auto">
                <div>
                  Requested: {new Date(request.requestDate).toLocaleString()}
                </div>
                {request.reviewDate && (
                  <div>
                    Reviewed: {new Date(request.reviewDate).toLocaleString()}
                  </div>
                )}
                {request.reviewNotes && (
                  <div className="mt-2 text-gray-200">
                    <strong>Review Notes:</strong> {request.reviewNotes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {reviewingRequest && (
        <RequestReviewModal
          request={reviewingRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setReviewingRequest(null)}
        />
      )}
    </div>
  );
}