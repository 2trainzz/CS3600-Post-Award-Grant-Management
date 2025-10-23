/**
 * RequestReviewModal Component
 * 
 * Modal for approving or rejecting spending requests
 */

import { useState } from 'react';
import type { SpendingRequest } from '../types';

interface RequestReviewProps {
  request: SpendingRequest;
  onApprove: (reviewNotes: string) => void;
  onReject: (reviewNotes: string) => void;
  onClose: () => void;
}

export function RequestReviewModal({
  request,
  onApprove,
  onReject,
  onClose,
}: RequestReviewProps) {
  const [reviewNotes, setReviewNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Review Spending Request
        </h2>

        {/* Request Details */}
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">Category:</span>
              <span className="ml-2 capitalize">{request.category}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Amount:</span>
              <span className="ml-2 font-semibold">
                ${parseFloat(request.amount.toString()).toLocaleString()}
              </span>
            </div>
            {request.grant && (
              <div className="col-span-2">
                <span className="font-medium text-gray-600">Grant:</span>
                <span className="ml-2">
                  {request.grant.grantName} ({request.grant.grantNumber})
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <span className="font-medium text-gray-600 text-sm">Description:</span>
            <p className="text-sm text-gray-800 mt-1">{request.description}</p>
          </div>
        </div>

        {/* Review Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Notes (optional)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add any comments about this decision..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(reviewNotes)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            ❌ Reject
          </button>
          <button
            onClick={() => onApprove(reviewNotes)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            ✅ Approve
          </button>
        </div>
      </div>
    </div>
  );
}