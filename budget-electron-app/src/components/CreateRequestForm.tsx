//CreateRequestForm Component - manual mode and AI mode

import { useState } from 'react'; 
import type { Grant } from '../types'; 
// import type { AiParsedData } from '../types'; 
import Modal from './components/Modal';

interface CreateRequestFormProps {
  grants: Grant[];
  // aiLoading: boolean;
  // aiParsedData: AiParsedData | null;
  onSubmit: (data: {
    grantId: number;
    category: string;
    amount: number;
    description: string;
  }) => void;
  onShowErrorModal: (message: string) => void;
  // onAiParse: (grantId: number, message: string) => void;
  // onClearAiData: () => void;
}

export function CreateRequestForm({
  grants,
  // aiLoading,
  // aiParsedData,
  onSubmit,
  onShowErrorModal
  // onAiParse,
  // onClearAiData,
}: CreateRequestFormProps) {
  const [grantId, setGrantId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // AI mode state - COMMENTED 
  // const [useAiMode, setUseAiMode] = useState(false);
  // const [aiMessage, setAiMessage] = useState('');
  // const [showAiTooltip, setShowAiTooltip] = useState(true);
  // const [hasClickedAiButton, setHasClickedAiButton] = useState(false);

  // AI parsed data effect - COMMENTED OUT
  // useEffect(() => {
  //   if (aiParsedData) {
  //     setCategory(aiParsedData.category);
  //     setAmount(aiParsedData.amount.toString());
  //     setDescription(aiParsedData.description);
  //   }
  // }, [aiParsedData]); 

  // AI parse handler - COMMENTED OUT
  // const handleAiParse = () => {
  //   if (!aiMessage.trim() || !grantId) {
  //     onShowErrorModal('Please select a grant and enter a request');
  //     return;
  //   }
  //   onAiParse(parseInt(grantId), aiMessage);
  // };

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
    // setAiMessage('');
    // onClearAiData();
  };

  // AI mode toggle - COMMENTED OUT
  // const handleToggleAiMode = () => {
  //   setUseAiMode(!useAiMode);
  //   onClearAiData();
  //   if (!hasClickedAiButton) {
  //     setHasClickedAiButton(true);
  //     setShowAiTooltip(false);
  //   }
  // };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Create Spending Request</h2>
        {/* AI Assistant Button - COMMENTED OUT*/}
        {/* <div className="relative">
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
        </div> */}
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
      </div>
    </div>
  );
}