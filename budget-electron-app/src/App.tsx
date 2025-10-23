/**
 * Main App Component
 * 
 * This is your refactored App.tsx - much cleaner!
 * All logic has been moved to hooks
 * All UI has been moved to components
 * 
 * NO NEW DEPENDENCIES - Same functionality, just organized
 */

import { useState, useEffect } from 'react';
import './App.css';
import './types/index.ts'

// Hooks
import { useAuth } from './hooks/useAuth';
import { useGrants } from './hooks/useGrants';
import { useSpendingRequests } from './hooks/useSpendingRequests';

// Components
import { LoginForm } from './components/LoginForm';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { GrantsList } from './components/GrantsList';
import { CreateRequestForm } from './components/CreateRequestForm';
import { RequestsList } from './components/RequestsList';

// Constants
import { VIEWS } from './config/constants';

function App() {
  // State management via custom hooks
  const auth = useAuth();
  const grants = useGrants();
  const spending = useSpendingRequests();

  // View navigation
  const [view, setView] = useState(VIEWS.GRANTS);

  // Combined error state for display
  const error = auth.error || grants.error || spending.error;

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================

  const handleLogin = async (username: string, password: string) => {
    const success = await auth.login(username, password);
    if (success) {
      setView(VIEWS.GRANTS);
      // Load grants after successful login
      if (auth.token) {
        grants.loadGrants(auth.token);
      }
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setView(VIEWS.GRANTS);
    // Clear data on logout
    spending.clearAiData();
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleNavigate = (newView: string) => {
    setView(newView);

    // Load data when navigating to requests view
    if (newView === VIEWS.REQUESTS && auth.token) {
      spending.loadRequests(auth.token);
    }
  };

  // ============================================================================
  // SPENDING REQUEST HANDLERS
  // ============================================================================

  const handleCreateRequest = async (data: {
    grantId: number;
    category: string;
    amount: number;
    description: string;
  }) => {
    if (!auth.token) return;

    const success = await spending.createRequest(auth.token, data);
    if (success) {
      alert('Spending request created successfully!');
      // Switch to requests view and load them
      setView(VIEWS.REQUESTS);
      spending.loadRequests(auth.token);
    }
  };

  const handleAiParse = async (grantId: number, userMessage: string) => {
    if (!auth.token) return;
    await spending.parseWithAI(auth.token, grantId, userMessage);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load grants when user logs in
  useEffect(() => {
    if (auth.token) {
      grants.loadGrants(auth.token);
    }
  }, [auth.token]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show login screen if not authenticated
  if (!auth.isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={auth.error} />;
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={auth.user} onLogout={handleLogout} />

      {/* Navigation */}
      <Navigation currentView={view} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* View Routing */}
        {view === VIEWS.GRANTS && (
          <GrantsList grants={grants.grants} />
        )}

        {view === VIEWS.CREATE && (
          <CreateRequestForm
            grants={grants.grants}
            aiLoading={spending.aiLoading}
            aiParsedData={spending.aiParsedData}
            onSubmit={handleCreateRequest}
            onAiParse={handleAiParse}
            onClearAiData={spending.clearAiData}
          />
        )}

        {view === VIEWS.REQUESTS && (
          <RequestsList requests={spending.requests} />
        )}
      </main>
    </div>
  );
}

export default App;