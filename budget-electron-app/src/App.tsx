import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [grants, setGrants] = useState([]);
  const [spendingRequests, setSpendingRequests] = useState([]);
  const [error, setError] = useState('');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Request form state
  const [reqGrantId, setReqGrantId] = useState('');
  const [reqCategory, setReqCategory] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqDescription, setReqDescription] = useState('');

  // AI chat state
  const [aiMessage, setAiMessage] = useState('');
  const [aiParsedData, setAiParsedData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [useAiMode, setUseAiMode] = useState(false);
  const [showAiTooltip, setShowAiTooltip] = useState(false);
  const [hasClickedAiButton, setHasClickedAiButton] = useState(false);

  // Login
  const handleLogin = async () => {
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      setToken(data.token);
      setUser(data.user);
      setView('grants');
      fetchGrants(data.token);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  // Logout
  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    setToken(null);
    setUser(null);
    setView('login');
    setGrants([]);
    setHasClickedAiButton(false); // Reset tooltip state on logout
  };

  // Fetch grants
  const fetchGrants = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/grants`, {
        headers: { 'Authorization': `Bearer ${authToken || token}` }
      });
      const data = await res.json();
      setGrants(data.grants || []);
    } catch (err) {
      setError('Failed to fetch grants');
    }
  };

  // Fetch spending requests
  const fetchSpendingRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/spending-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSpendingRequests(data.requests || []);
    } catch (err) {
      setError('Failed to fetch spending requests');
    }
  };

  // AI Parse Request
  const handleAiParse = async () => {
    if (!aiMessage.trim() || !reqGrantId) {
      setError('Please select a grant and enter a request');
      return;
    }
    
    setAiLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/spending-requests/ai-parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grantId: parseInt(reqGrantId),
          userMessage: aiMessage
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to parse request');
        setAiLoading(false);
        return;
      }
      
      setAiParsedData(data.parsed);
      // Auto-fill the form with parsed data
      setReqCategory(data.parsed.category);
      setReqAmount(data.parsed.amount.toString());
      setReqDescription(data.parsed.description);
      
    } catch (err) {
      setError('Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  // Create spending request
  const handleCreateRequest = async () => {
    setError('');
    
    if (!reqGrantId || !reqCategory || !reqAmount || !reqDescription) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/spending-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grantId: parseInt(reqGrantId),
          amount: parseFloat(reqAmount),
          category: reqCategory,
          description: reqDescription
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create request');
        return;
      }
      
      alert('Spending request created successfully!');
      setReqGrantId('');
      setReqCategory('');
      setReqAmount('');
      setReqDescription('');
      setAiMessage('');
      setAiParsedData(null);
      setView('requests');
      fetchSpendingRequests();
    } catch (err) {
      setError('Failed to create spending request');
    }
  };

  // Load spending requests when switching to requests view
  useEffect(() => {
    if (view === 'requests' && token) {
      fetchSpendingRequests();
    }
  }, [view, token]);

  // Show AI tooltip until user clicks the button for the first time
  useEffect(() => {
    if (view === 'create' && token && !useAiMode && !hasClickedAiButton) {
      setShowAiTooltip(true);
    } else {
      setShowAiTooltip(false);
    }
  }, [view, token, useAiMode, hasClickedAiButton]);

  // Login View 
  if (!token) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-darkblue to-black p-4">
        <div className="bg-dark-card rounded-2xl shadow-lg p-10 w-full max-w-md animate-glow border border-accent">
          <h1 className="text-3xl font-bold text-center text-accent mb-6 drop-shadow-lg">
            Budget Buddy Login
          </h1>
          
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="admin or researcher"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="password123"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full mt-4 p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300"
            >
              Login
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-400 text-center">
            <p>Test credentials:</p>
            <p className="font-mono">admin / password123</p>
            <p className="font-mono">researcher / password123</p>
          </div>
        </div>
      </div>
    );
  }

  // Main App View 
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-darkblue to-black text-white">
      <header className="bg-dark-card shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-accent">Grant Management</h1>
            <p className="text-gray-300 text-sm">
              Welcome, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-accent text-accent px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-darkblue"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-dark-card/50 backdrop-blur-sm shadow-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setView('grants')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'grants'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              My Grants
            </button>
            
            {/* COMMENTED OUT - Create Request Tab
            <button
              onClick={() => setView('create')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'create'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Create Request
            </button>
            */}

            <button
              onClick={() => setView('requests')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'requests'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {view === 'grants' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">My Grants</h2>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {grants.map((grant) => (
                <div key={grant.id} className="bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-white truncate">{grant.grantName}</h3>
                      <p className="text-sm text-gray-400">{grant.grantNumber}</p>
                    </div>
                    <span className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                      grant.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {grant.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm flex-grow">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Amount:</span>
                      <span className="font-semibold text-white">${parseFloat(grant.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Remaining:</span>
                      <span className="font-semibold text-accent">${parseFloat(grant.remainingAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Student Balance:</span>
                      <span className="font-semibold text-white">${parseFloat(grant.studentBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Travel Balance:</span>
                      <span className="font-semibold text-white">${parseFloat(grant.travelBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-300">Period:</span>
                      <span className="text-white text-xs">
                        {new Date(grant.startDate).toLocaleDateString()} - {new Date(grant.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {grant.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-gray-700 pt-3">{grant.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'create' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Spending Request</h2>
              <div className="relative">
                <button
                  onClick={() => {
                    setUseAiMode(!useAiMode);
                    setAiParsedData(null);
                    setError('');
                    if (!hasClickedAiButton) {
                      setHasClickedAiButton(true);
                    }
                  }}
                  className="px-3 py-2 bg-accent text-darkblue rounded-md hover:bg-[#52e0c4] transition-all duration-300 font-semibold text-sm shadow-lg"
                >
                  {useAiMode ? 'Manual Mode' : 'AI Assistant'}
                </button>
                
                {showAiTooltip && (
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
                  value={reqGrantId}
                  onChange={(e) => setReqGrantId(e.target.value)}
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
                        value={aiMessage}
                        onChange={(e) => setAiMessage(e.target.value)}
                        rows={4}
                        className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Example: I need $2500 for travel to the ACM conference in Seattle next month, including flights and hotel for 3 days"
                        disabled={aiLoading}
                      />
                    </div>

                    <button
                      onClick={handleAiParse}
                      disabled={aiLoading || !reqGrantId || !aiMessage.trim()}
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
                              setAiParsedData(null);
                              setAiMessage('');
                            }}
                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
                          >
                            Clear & Retry
                          </button>
                          <button
                            onClick={handleCreateRequest}
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
                        value={reqCategory}
                        onChange={(e) => setReqCategory(e.target.value)}
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
                        value={reqAmount}
                        onChange={(e) => setReqAmount(e.target.value)}
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
                        value={reqDescription}
                        onChange={(e) => setReqDescription(e.target.value)}
                        rows={4}
                        className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Provide details about this spending request..."
                      />
                    </div>

                    <button
                      onClick={handleCreateRequest}
                      className="w-full p-3 bg-accent text-darkblue font-semibold rounded-md hover:bg-[#52e0c4] transition-all duration-300"
                    >
                      Submit Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">My Spending Requests</h2>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {spendingRequests.length === 0 ? (
                <div className="col-span-full bg-dark-card rounded-lg shadow-lg border border-gray-700 p-8 text-center text-gray-400">
                  No spending requests yet. Create one to get started!
                </div>
              ) : (
                spendingRequests.map((request) => (
                  <div key={request.id} className="bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white capitalize truncate">{request.category}</h3>
                        <p className="text-sm text-gray-400 truncate">
                          {request.grant?.grantName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ({request.grant?.grantNumber})
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-xl font-bold text-white whitespace-nowrap">
                          ${parseFloat(request.amount).toLocaleString()}
                        </div>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved' ? 'bg-green-900 text-green-300' :
                          request.status === 'rejected' ? 'bg-red-900 text-red-300' :
                          request.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-blue-900 text-blue-300'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3 flex-grow">{request.description}</p>
                    
                    <div className="text-xs text-gray-400 border-t border-gray-700 pt-3 space-y-1 mt-auto">
                      <div>Requested: {new Date(request.requestDate).toLocaleString()}</div>
                      {request.reviewDate && (
                        <div>Reviewed: {new Date(request.reviewDate).toLocaleString()}</div>
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;