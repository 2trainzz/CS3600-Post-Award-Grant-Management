/**
 * RequestReviewModal Component
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

  // Helper function to get AI pre-approval badge styling
  const getPreApprovalBadge = (recommendation: string | undefined) => {
    switch (recommendation) {
      case 'approved':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'AI Pre-Approved',
          icon: '✓'
        };
      case 'needs_review':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          label: 'AI: Needs Review',
          icon: '⚠'
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'AI: Concerns',
          icon: '✗'
        };
      default:
        return null;
    }
  };

  const preApprovalBadge = request.aiPreApprovalRecommendation
    ? getPreApprovalBadge(request.aiPreApprovalRecommendation)
    : null;

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

        {/* AI Analysis Section */}
  {request.aiPreApprovalRecommendation && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-accent">🤖</span> AI Analysis
            </h3>
            
            {/* AI Pre-Approval Badge */}
            {preApprovalBadge && (
              <div className={`p-4 rounded-md border mb-3 ${preApprovalBadge.bg} ${preApprovalBadge.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${preApprovalBadge.text} mb-2`}>
                  <span className="text-xl">{preApprovalBadge.icon}</span>
                  <span>{preApprovalBadge.label}</span>
                </div>
                {request.aiPreApprovalReasoning && (
                  <p className="text-xs text-gray-300">
                    <span className="font-semibold">Reasoning:</span> {request.aiPreApprovalReasoning}
                  </p>
                )}
                {request.aiConfidence !== null && request.aiConfidence !== undefined && (
                  <p className="text-xs text-gray-300 mt-1">
                    <span className="font-semibold">Confidence:</span> {(Number(request.aiConfidence) * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {/* AI Detected Problems */}
                {request.aiWarnings && (
                  <div className="p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                    <div className="text-sm font-semibold text-orange-400 mb-2">
                      ⚠ AI Detected Problems:
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {(Array.isArray(request.aiWarnings) ? request.aiWarnings : [request.aiWarnings]).map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
        )} 

        {/* Request Details */}
        <div className="bg-dark-input rounded-md p-4 mb-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Request Details</h3>
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
            {/* Display who created the request */}
            {request.users && request.users.length > 0 && (
              <div className='col-span-2'>
                <span className="font-medium text-gray-400">Submitted By:</span>
                <span className="ml-2 text-white">
                  {(() => {
                    const creator = request.users.find(u => u.role === 'creator');
                    return creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown';
                  })()}
                </span>
                </div>
            )}
            <div className="col-span-2">
              <span className="font-medium text-gray-400">Requested:</span>
              <span className="ml-2 text-white">
                {new Date(request.requestDate).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium text-gray-400 text-sm">Description:</span>
            <p className="text-sm text-white mt-1">{request.description}</p>
          </div>
        </div>

        {/* Existing Comments */}
        {request.reviewNotes && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Comments
            </h3>
            <div className="bg-dark-input rounded-md p-4 border border-gray-700">
              <div className="whitespace-pre-wrap text-sm">
                {request.reviewNotes.split('\n').map((line, i) => {
                  if (line.includes('(admin)') && line.includes('APPROVED')) {
                    return (
                      <div key={i} className="text-green-400 font-semibold mb-1">
                        ☑️ {line}
                      </div>
                    );
                  } else if (line.includes('(admin)') && line.includes('REJECTED')) {
                    return (
                      <div key={i} className="text-red-400 font-semibold mb-1">
                        🗙 {line}
                      </div>
                    );
                  } else if (line.includes('(faculty)')) {
                    return (
                      <div key={i} className="text-blue-300 mb-1">
                        {line}
                      </div>
                    );
                  } else if (line.trim()) {
                    return <div key={i} className="text-gray-300 mb-1">{line}</div>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}

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