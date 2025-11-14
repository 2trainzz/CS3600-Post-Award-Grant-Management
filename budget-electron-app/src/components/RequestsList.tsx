//RequestsList Component - displays the spending requests view

import { useState } from 'react';
import type { SpendingRequest } from '../types';
import { STATUS_COLORS } from '../config/constants';
import { RequestReviewModal } from './RequestReview';
import { string } from 'zod';

interface RequestsListProps {
  requests: SpendingRequest[];
  onApprove?: (requestId: number, reviewNotes: string) => void;
  onReject?: (requestId: number, reviewNotes: string) => void;
  userRole?: string;
  onAddComment?: (requestId: number, comment: string) => void;
}

export function RequestsList({ requests, onApprove, onReject, userRole, onAddComment }: RequestsListProps) {
  const [reviewingRequest, setReviewingRequest] = useState<SpendingRequest | null>(null);
  const [commentingRequest, setCommentingRequest] = useState<SpendingRequest | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ai-approved' | 'ai-concerns'>('newest');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Filter requests by status
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const historyRequests = requests.filter(req => req.status !== 'pending');

  // Determine which list to display based on active tab
  const displayRequests = activeTab === 'pending' ? pendingRequests : historyRequests;

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

  const handleAddComment = () => {
    if (commentingRequest && onAddComment && commentText.trim()) {
      onAddComment(commentingRequest.id, commentText);
      setCommentingRequest(null);
      setCommentText('');
    }
  };

  // Helper function to get AI pre-approval badge styling
  const getPreApprovalBadge = (recommendation: string) => {
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

  // Sort requests based on selected option
  const sortedRequests = [...displayRequests].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      case 'oldest':
        return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
      case 'ai-approved':
        // AI approved first, then needs_review, then rejected, then no AI data
        const scoreA = a.preApprovalStatus?.recommendation === 'approved' ? 3 : 
                      a.preApprovalStatus?.recommendation === 'needs_review' ? 2 : 
                      a.preApprovalStatus?.recommendation === 'rejected' ? 1 : 0;
        const scoreB = b.preApprovalStatus?.recommendation === 'approved' ? 3 : 
                      b.preApprovalStatus?.recommendation === 'needs_review' ? 2 : 
                      b.preApprovalStatus?.recommendation === 'rejected' ? 1 : 0;
        return scoreB - scoreA;
      case 'ai-concerns':
        // AI rejected/concerns first, then needs_review, then approved, then no AI data
        const concernScoreA = a.preApprovalStatus?.recommendation === 'rejected' ? 3 : 
                             a.preApprovalStatus?.recommendation === 'needs_review' ? 2 : 
                             a.preApprovalStatus?.recommendation === 'approved' ? 1 : 0;
        const concernScoreB = b.preApprovalStatus?.recommendation === 'rejected' ? 3 : 
                             b.preApprovalStatus?.recommendation === 'needs_review' ? 2 : 
                             b.preApprovalStatus?.recommendation === 'approved' ? 1 : 0;
        return concernScoreB - concernScoreA;
      default:
        return 0;
    }
  });
  
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">My Spending Requests</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-accent text-darkblue shadow-lg'
              : 'bg-dark-card text-gray-400 hover:bg-gray-800 border border-gray-700'
          }`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
              activeTab === 'pending' ? 'bg-darkblue text-accent' : 'bg-gray-700 text-white'
            }`}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-accent text-darkblue shadow-lg'
              : 'bg-dark-card text-gray-400 hover:bg-gray-800 border border-gray-700'
          }`}
        >
          Request History
          {historyRequests.length > 0 && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
              activeTab === 'history' ? 'bg-darkblue text-accent' : 'bg-gray-700 text-white'
            }`}>
              {historyRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-400">
          {activeTab === 'pending' 
            ? 'Requests awaiting review' 
            : 'Approved and rejected requests'}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-dark-card border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            {activeTab === 'pending' && (
              <>
                <option value="ai-approved">AI Approved First</option>
                <option value="ai-concerns">AI Concerns First</option>
              </>
            )}
          </select>
        </div>
      </div>
      
      {/* Grid layout */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {sortedRequests.length === 0 ? (
          // "No requests" styling
          <div className="col-span-full bg-dark-card rounded-lg shadow-lg border border-gray-700 p-8 text-center text-gray-400">
            {activeTab === 'pending' 
              ? 'No pending requests. Create one to get started!' 
              : 'No request history yet.'}
          </div>
        ) : (
          sortedRequests.map((request) => {
            const preApprovalBadge = request.preApprovalStatus 
              ? getPreApprovalBadge(request.preApprovalStatus.recommendation)
              : null;

            return (
              <div 
                key={request.id} 
                // Card styling with conditional border for AI pre-approval
                className={`bg-dark-card rounded-lg shadow-lg border p-6 hover:border-accent/50 transition-colors flex flex-col ${
                  preApprovalBadge && request.status === 'pending'
                    ? `${preApprovalBadge.border} border-2`
                    : 'border-gray-700'
                }`}
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

                {/* AI Pre-Approval Badge */}
                {preApprovalBadge && request.status === 'pending' && (
                  <div className={`mb-3 p-3 rounded-md border ${preApprovalBadge.bg} ${preApprovalBadge.border}`}>
                    <div className={`flex items-center gap-2 text-sm font-semibold ${preApprovalBadge.text} mb-1`}>
                      <span>{preApprovalBadge.icon}</span>
                      <span>{preApprovalBadge.label}</span>
                    </div>
                    {request.preApprovalStatus?.reasoning && (
                      <p className="text-xs text-gray-300 mt-1">
                        {request.preApprovalStatus.reasoning}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-300 mb-3 flex-grow">{request.description}</p>

                {/* Warnings from AI */}
                {request.warnings && request.warnings.length > 0 && (
                  <div className="mb-3 p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                    <div className="text-sm font-semibold text-orange-400 mb-1">
                      ⚠ AI Detected Concerns:
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {request.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Action Buttons for Pending Requests */}
                {userRole === 'faculty' && request.status === 'pending' && onAddComment && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setCommentingRequest(request)}
                      className="flex-1 bg-accent text-darkblue py-2 px-4 rounded-md hover:bg-[#52e0c4] transition-colors text-sm font-semibold"
                    >
                      Add Comment
                    </button>
                  </div>
                )}
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
                      <strong>Comments & Review Notes:</strong> {request.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/*Review Modal (Admin) */}
      {reviewingRequest && (
        <RequestReviewModal
          request={reviewingRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setReviewingRequest(null)}
        />
      )}

      {/* Comment Modal (Faculty) */}
      {commentingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Add Comment
            </h2>

            {/* Request Summary */}
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <div className="text-sm">
                <span className="font-medium">Request:</span>
                <span className="ml-2 capitalize">{commentingRequest.category}</span>
                <span className="ml-2">-</span>
                <span className="ml-2 font-semibold">
                  ${parseFloat(commentingRequest.amount.toString()).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Comment Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Comment
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add your feedback or recommendations for the admin..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCommentingRequest(null);
                  setCommentText('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                💬 Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}