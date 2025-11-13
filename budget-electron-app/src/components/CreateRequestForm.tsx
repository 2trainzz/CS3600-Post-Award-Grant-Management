//CreateRequestForm Component - manual mode and AI mode

import { useState, useEffect } from 'react'; 
import type { Grant } from '../types'; 
import type { AiParsedData } from '../types'; 

interface CreateRequestFormProps {
  grants: Grant[];
  aiLoading: boolean;
  aiParsedData: AiParsedData | null;
  onSubmit: (data: {
    grantId: number;
    category: string;
    amount: number;
    description: string;
  }) => void;
  onShowErrorModal: (message: string) => void;
  onAiParse: (grantId: number, message: string) => void;
  onClearAiData: () => void;
}

export function CreateRequestForm({
  grants,
  aiLoading,
  aiParsedData,
  onSubmit,
  onShowErrorModal,
  onAiParse,
  onClearAiData,
}: CreateRequestFormProps) {
  const [grantId, setGrantId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // AI mode state
  const [useAiMode, setUseAiMode] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [showAiTooltip, setShowAiTooltip] = useState(true);
  const [hasClickedAiButton, setHasClickedAiButton] = useState(false);

  // AI parsed data effect
  useEffect(() => {
    if (aiParsedData) {
      setCategory(aiParsedData.category);
      setAmount(aiParsedData.amount.toString());
      setDescription(aiParsedData.description);
    }
  }, [aiParsedData]); 

  // AI parse handler
  const handleAiParse = () => {
    if (!aiMessage.trim() || !grantId) {
      onShowErrorModal('Please select a grant and enter a request');
      return;
    }
    onAiParse(parseInt(grantId), aiMessage);
  };

  // Submit AI reviewed request directly
  const handleSubmitAiRequest = () => {
    if (!grantId || !aiParsedData) {
      onShowErrorModal('Please parse your request with AI first');
      return;
    }

    onSubmit({
      grantId: parseInt(grantId),
      category: aiParsedData.category,
      amount: aiParsedData.amount,
      description: aiParsedData.description,
    });

    // Reset form
    setGrantId('');
    setCategory('');
    setAmount('');
    setDescription('');
    setAiMessage('');
    onClearAiData();
  };

  const handleSubmit = () => {
    if (!grantId || !category || !amount || !description) {
      onShowErrorModal('Please fill in all fields');
      return;
    }

    onSubmit({
      grantId: parseInt(grantId),
      category,
      amount: parseFloat(amount),
      description,
    });

    //reset form
    setGrantId('');
    setCategory('');
    setAmount('');
    setDescription('');
    setAiMessage('');
    onClearAiData();
  };

  // AI mode toggle
  const handleToggleAiMode = () => {
    setUseAiMode(!useAiMode);
    onClearAiData();
    if (!hasClickedAiButton) {
      setHasClickedAiButton(true);
      setShowAiTooltip(false);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Create Spending Request</h2>
        {/* AI Assistant Button */}
        <div className="relative">
          <button
            onClick={handleToggleAiMode}
            className="px-3 py-2 bg-accent text-darkblue rounded-md hover:bg-[#52e0c4] transition-all duration-300 font-semibold text-sm shadow-lg"
          >
            {useAiMode ? 'Manual Mode' : 'AI Assistant'}
          </button>
          
          {showAiTooltip && !useAiMode && !hasClickedAiButton && (
            <div className="absolute -bottom-12 right-0 bg-accent text-darkblue px-4 py-2 rounded-lg shadow-lg animate-bounce whitespace-nowrap font-bold text-sm z-50">
              Try me!
              <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-3 h-3 bg-accent"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors flex flex-col">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Grant
          </label>
          <select
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select a grant...</option>
            {grants.map((grant) => (
              <option key={grant.id} value={grant.id}>
                {grant.grantName} ({grant.grantNumber})
              </option>
            ))}
          </select>
        </div>

        {useAiMode ? (
          <div className="lg:col-span-2 xl:col-span-2 bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Describe your spending request
                </label>
                <textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., I need $500 for a flight to Boston for a conference next month"
                  disabled={aiLoading}
                />
              </div>

              <button
                onClick={handleAiParse}
                disabled={aiLoading}
                className="w-full p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? 'Processing...' : 'Parse with AI'}
              </button>

              {aiParsedData && (
                <div className="space-y-4">
                  {/* AI Pre-Approval Badge */}
                  {aiParsedData.preApprovalRecommendation && (() => {
                    const badge = getPreApprovalBadge(aiParsedData.preApprovalRecommendation);
                    return badge ? (
                      <div className={`p-4 rounded-md border ${badge.bg} ${badge.border}`}>
                        <div className={`flex items-center gap-2 text-sm font-semibold ${badge.text} mb-2`}>
                          <span className="text-xl">{badge.icon}</span>
                          <span>{badge.label}</span>
                        </div>
                        {aiParsedData.preApprovalReasoning && (
                          <p className="text-xs text-gray-300">
                            {aiParsedData.preApprovalReasoning}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}

                  {/* Parsed Data Display */}
                  <div className="p-4 bg-dark-input rounded-md border border-accent/30">
                    <h3 className="text-sm font-medium text-accent mb-2">AI Parsed Data:</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p><span className="font-semibold">Category:</span> {aiParsedData.category}</p>
                      <p><span className="font-semibold">Amount:</span> ${aiParsedData.amount}</p>
                      <p><span className="font-semibold">Description:</span> {aiParsedData.description}</p>
                      {aiParsedData.confidence !== null && aiParsedData.confidence !== undefined && (
                        <p>
                          <span className="font-semibold">AI Confidence:</span>{' '}
                          <span className={`font-bold ${
                            aiParsedData.confidence >= 0.8 ? 'text-green-400' :
                            aiParsedData.confidence >= 0.5 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {(aiParsedData.confidence * 100).toFixed(0)}%
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Warnings */}
                  {aiParsedData.warnings && aiParsedData.warnings.length > 0 && (
                    <div className="p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                      <div className="text-sm font-semibold text-orange-400 mb-1">
                        ⚠ AI Detected Concerns:
                      </div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {aiParsedData.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Submit AI Request Button */}
                  <button
                    onClick={handleSubmitAiRequest}
                    className="w-full p-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-all duration-300 shadow-lg"
                  >
                    Submit AI Reviewed Request
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 xl:col-span-2 bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select category...</option>
                  <option value="travel">Travel</option>
                  <option value="students">Students</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  step="0.01"
                  min="0"
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={4}
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Provide details about this spending request..."
                />
              </div>

              <button
                onClick={handleSubmit} 
                className="w-full p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300"
              >
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}