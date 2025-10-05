/*
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // Fetch from Express server
    fetch('http://localhost:3001/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  const fetchData = () => {
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(result => setData(result.data))
      .catch(err => console.error(err));
  };

  return (
    <div className="App">
      <h1>Electron + React + Express</h1>
      <p>Message from server: {message}</p>
      <button onClick={fetchData}>Fetch Data</button>
      <ul>
        {data.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

export default App;
*/


import { useState, useEffect } from 'react';
import './App.css';

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

  // Login
  const handleLogin = async () => {
    console.log('Attempting login to:', `${API_BASE}/auth/login`);
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

  // Login View
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Grant Management System
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin or researcher"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="password123"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Login
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-600 text-center">
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Grant Management</h1>
            <p className="text-indigo-200 text-sm">
              Welcome, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setView('grants')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'grants'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Grants
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'create'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Request
            </button>
            <button
              onClick={() => setView('requests')}
              className={`px-4 py-3 font-medium transition-colors ${
                view === 'requests'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {view === 'grants' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Grants</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {grants.map((grant) => (
                <div key={grant.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{grant.grantName}</h3>
                      <p className="text-sm text-gray-500">{grant.grantNumber}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      grant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {grant.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-gray-900">${parseFloat(grant.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-semibold text-indigo-600">${parseFloat(grant.remainingAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student Balance:</span>
                      <span className="font-semibold text-gray-900">${parseFloat(grant.studentBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel Balance:</span>
                      <span className="font-semibold text-gray-900">${parseFloat(grant.travelBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Period:</span>
                      <span className="text-gray-900">
                        {new Date(grant.startDate).toLocaleDateString()} - {new Date(grant.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {grant.description && (
                    <p className="mt-4 text-sm text-gray-600 border-t pt-3">{grant.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'create' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Spending Request</h2>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grant
                  </label>
                  <select
                    value={reqGrantId}
                    onChange={(e) => setReqGrantId(e.target.value)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
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
                    value={reqAmount}
                    onChange={(e) => setReqAmount(e.target.value)}
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
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Provide details about this spending request..."
                  />
                </div>

                <button
                  onClick={handleCreateRequest}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Spending Requests</h2>
            <div className="space-y-4">
              {spendingRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  No spending requests yet. Create one to get started!
                </div>
              ) : (
                spendingRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 capitalize">{request.category}</h3>
                        <p className="text-sm text-gray-500">
                          {request.grant?.grantName} ({request.grant?.grantNumber})
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          ${parseFloat(request.amount).toLocaleString()}
                        </div>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    
                    <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
                      <div>Requested: {new Date(request.requestDate).toLocaleString()}</div>
                      {request.reviewDate && (
                        <div>Reviewed: {new Date(request.reviewDate).toLocaleString()}</div>
                      )}
                      {request.reviewNotes && (
                        <div className="mt-2 text-gray-700">
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
