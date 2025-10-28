/**
 * RequestReviewModal Component
 * * Modal for approving or rejecting spending requests
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
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      {/* Modal card */}
      <div
        className="bg-dark-card rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        // prevent clicks inside the modal from reaching the backdrop
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          Review Spending Request
        </h2>

        {/* Request Details */}
        <div className="bg-dark-input rounded-md p-4 mb-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-400">Category:</span>
              <span className="ml-2 capitalize text-white">{request.category}</span>
            </div>
            <div>
              <span className="font-medium text-gray-400">Amount:</span>
              <span className="ml-2 font-semibold text-accent">
                ${parseFloat(request.amount.toString()).toLocaleString()}
              </span>
            </div>
            {request.grant && (
              <div className="col-span-2">
                <span className="font-medium text-gray-400">Grant:</span>
                <span className="ml-2 text-white">
                  {request.grant.grantName} ({request.grant.grantNumber})
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <span className="font-medium text-gray-400 text-sm">Description:</span>
            <p className="text-sm text-white mt-1">{request.description}</p>
          </div>
        </div>

        {/* Review Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Review Notes (optional)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
            tabIndex={0}
            className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Add any comments about this decision..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(reviewNotes)}
            className="flex-1 bg-red-900 text-red-300 py-2 px-4 rounded-md hover:bg-red-800 transition-colors font-medium"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(reviewNotes)}
            className="flex-1 bg-green-900 text-green-300 py-2 px-4 rounded-md hover:bg-green-800 transition-colors font-medium"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}