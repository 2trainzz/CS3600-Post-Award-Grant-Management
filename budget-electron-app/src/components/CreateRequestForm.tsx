//CreateRequestForm Component - manual mode and AI mode

import { useState, useEffect } from 'react'; 
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
  const [grantId, setGrantId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // AI mode state
  const [useAiMode, setUseAiMode] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // New tooltip state 
  const [showAiTooltip, setShowAiTooltip] = useState(true);
  const [hasClickedAiButton, setHasClickedAiButton] = useState(false);

  useEffect(() => {
    if (aiParsedData) {
      setCategory(aiParsedData.category);
      setAmount(aiParsedData.amount.toString());
      setDescription(aiParsedData.description);
    }
  }, [aiParsedData]); 

  const handleAiParse = () => {
    if (!aiMessage.trim() || !grantId) {
      alert('Please select a grant and enter a request');
      return;
    }
    onAiParse(parseInt(grantId), aiMessage);
  };

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

    //reset form
    setGrantId('');
    setCategory('');
    setAmount('');
    setDescription('');
    setAiMessage('');
    onClearAiData();
  };

  const handleToggleAiMode = () => {
    setUseAiMode(!useAiMode);
    onClearAiData();
    if (!hasClickedAiButton) {
      setHasClickedAiButton(true);
      setShowAiTooltip(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Create Spending Request</h2>
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

        <div className="lg:col-span-2 xl:col-span-2 bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors">
          {useAiMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Describe your request
                </label>
                <textarea
                  value={aiMessage} // V1 state
                  onChange={(e) => setAiMessage(e.target.value)} // V1 state
                  rows={4}
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Example: I need $2500 for travel to the ACM conference in Seattle next month, including flights and hotel for 3 days"
                  disabled={aiLoading}
                />
              </div>

              <button
                onClick={handleAiParse} // V1 handler
                disabled={aiLoading || !grantId || !aiMessage.trim()} // V1 state
                className="w-full p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                {aiLoading ? 'Analyzing...' : 'Parse with AI'}
              </button>

              {aiParsedData && (
                <div className="mt-6 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Parsed Information</h3>
                  
                  {aiParsedData.warnings && aiParsedData.warnings.length > 0 && (
                    <div className="bg-yellow-900 border border-yellow-700 rounded-md p-3 mb-4">
                      <p className="text-sm font-medium text-yellow-300 mb-1">Warnings:</p>
                      <ul className="text-sm text-yellow-200 list-disc list-inside">
                        {aiParsedData.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3 bg-dark-input rounded-md p-4">
                    <div>
                      <span className="text-sm font-medium text-gray-400">Category:</span>
                      <span className="ml-2 text-sm text-white capitalize">{aiParsedData.category}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-400">Amount:</span>
                      <span className="ml-2 text-sm text-white">${aiParsedData.amount}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-400">Description:</span>
                      <p className="text-sm text-white mt-1">{aiParsedData.description}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-400">AI Confidence:</span>
                      <span className="ml-2 text-sm text-white">{Math.round(aiParsedData.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        onClearAiData();
                        setAiMessage('');
                      }}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
                    >
                      Clear & Retry
                    </button>
                    <button
                      onClick={handleSubmit} // V1 handler
                      className="flex-1 bg-accent text-darkblue font-semibold py-2 px-4 rounded-md hover:bg-[#52e0c4] transition-colors"
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category} // V1 state
                  onChange={(e) => setCategory(e.target.value)} // V1 state
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
                  value={amount} // V1 state
                  onChange={(e) => setAmount(e.target.value)} // V1 state
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
                  value={description} // V1 state
                  onChange={(e) => setDescription(e.target.value)} // V1 state
                  rows={4}
                  className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Provide details about this spending request..."
                />
              </div>

              <button
                onClick={handleSubmit} // V1 handler
                className="w-full p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300"
              >
                Submit Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}