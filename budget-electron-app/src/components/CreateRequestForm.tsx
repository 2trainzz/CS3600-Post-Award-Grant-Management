/**
 * CreateRequestForm Component
 * 
 * Extracted from App.tsx - the create spending request form
 * Includes both manual mode and AI mode
 * Same UI and logic, just in its own component
 */

import { useState } from 'react';
import type { Grant, AiParsedData } from '../types';

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
  onAiParse: (grantId: number, message: string) => void;
  onClearAiData: () => void;
}

export function CreateRequestForm({
  grants,
  aiLoading,
  aiParsedData,
  onSubmit,
  onAiParse,
  onClearAiData,
}: CreateRequestFormProps) {
  // Form state
  const [grantId, setGrantId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // AI mode state
  const [useAiMode, setUseAiMode] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Handle AI parse button
  const handleAiParse = () => {
    if (grantId && aiMessage.trim()) {
      onAiParse(parseInt(grantId), aiMessage);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!grantId || !category || !amount || !description) {
      alert('Please fill in all fields');
      return;
    }

    onSubmit({
      grantId: parseInt(grantId),
      category,
      amount: parseFloat(amount),
      description,
    });

    // Reset form
    setGrantId('');
    setCategory('');
    setAmount('');
    setDescription('');
    setAiMessage('');
    onClearAiData();
  };

  // When AI parses successfully, auto-fill form
  if (aiParsedData && (!category || !amount || !description)) {
    setCategory(aiParsedData.category);
    setAmount(aiParsedData.amount.toString());
    setDescription(aiParsedData.description);
  }

  return (
    <div>
      {/* Header with mode toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Spending Request</h2>
        <button
          onClick={() => {
            setUseAiMode(!useAiMode);
            onClearAiData();
          }}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium text-sm"
        >
          {useAiMode ? '📝 Manual Mode' : '🤖 AI Assistant'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {/* Grant Selection - Always shown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grant
          </label>
          <select
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a grant...</option>
            {grants.map((grant) => (
              <option key={grant.id} value={grant.id}>
                {grant.grantName} ({grant.grantNumber})
              </option>
            ))}
          </select>
        </div>

        {/* AI Mode */}
        {useAiMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your request
              </label>
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Example: I need $2500 for travel to the ACM conference in Seattle next month, including flights and hotel for 3 days"
                disabled={aiLoading}
              />
            </div>

            <button
              onClick={handleAiParse}
              disabled={aiLoading || !grantId || !aiMessage.trim()}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {aiLoading ? '🤖 Analyzing...' : '✨ Parse with AI'}
            </button>

            {/* AI Parsed Results */}
            {aiParsedData && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Parsed Information</h3>

                {aiParsedData.warnings && aiParsedData.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Warnings:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {aiParsedData.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3 bg-gray-50 rounded-md p-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Category:</span>
                    <span className="ml-2 text-sm text-gray-900 capitalize">{aiParsedData.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Amount:</span>
                    <span className="ml-2 text-sm text-gray-900">${aiParsedData.amount}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Description:</span>
                    <p className="text-sm text-gray-900 mt-1">{aiParsedData.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">AI Confidence:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {Math.round(aiParsedData.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      onClearAiData();
                      setAiMessage('');
                      setCategory('');
                      setAmount('');
                      setDescription('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    ❌ Clear & Retry
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    ✅ Confirm & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category...</option>
                <option value="travel">Travel</option>
                <option value="students">Students</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Provide details about this spending request..."
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Submit Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}