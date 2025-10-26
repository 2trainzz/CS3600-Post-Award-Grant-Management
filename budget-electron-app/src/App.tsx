/**
 * Main App Component
 * logic is in hooks
 * UI is in components
 */

import { useState, useEffect } from 'react';
import "./styles/index.css";

//hooks
import { useAuth } from './hooks/useAuth';
import { useGrants } from './hooks/useGrants';
import { useSpendingRequests } from './hooks/useSpendingRequests';

//components
import { LoginForm } from './components/LoginForm';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { GrantsList } from './components/GrantsList';
import { CreateRequestForm } from './components/CreateRequestForm';
import { RequestsList } from './components/RequestsList';

//constants
import { VIEWS } from './config/constants';

function App() {
  //state management via custom hooks
  const auth = useAuth();
  const grants = useGrants();
  const spending = useSpendingRequests();

  // key used to force a full remount of the app to clear any lingering UI state
  const [appKey, setAppKey] = useState(0);

  //view navigation
  const [view, setView] = useState<
    typeof VIEWS[keyof typeof VIEWS]
  >(VIEWS.GRANTS);

  //combined error state for display
  const error = auth.error || grants.error || spending.error;

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================

  const handleLogin = async (username: string, password: string) => {
    const success = await auth.login(username, password);
    if (success) {
      // If the user is an admin, show the requests view so they can review pending requests immediately
      if (auth.user?.role === 'admin') {
        setView(VIEWS.REQUESTS);
        if (auth.token) spending.loadRequests(auth.token);
      } else {
        setView(VIEWS.GRANTS);
        //load grants after successful login for non-admin users
        if (auth.token) {
          grants.loadGrants(auth.token);
        }
      }
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setView(VIEWS.GRANTS);
    //clear data on logout
    spending.clearAiData();
    // force remount to ensure any modal/backdrop state is cleared
    setAppKey((k) => k + 1);
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleNavigate = (newView: string) => {
    setView(newView as typeof VIEWS[keyof typeof VIEWS]);

    //load data when navigating to requests view
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
      //switch to requests view and load them
      setView(VIEWS.REQUESTS);
      spending.loadRequests(auth.token);
    }
  };

  const handleAiParse = async (grantId: number, userMessage: string) => {
    if (!auth.token) return;
    await spending.parseWithAI(auth.token, grantId, userMessage);
  };

  // ============================================================================
  // APPROVAL HANDLERS
  // ============================================================================

  const handleApprove = async (requestId: number, reviewNotes: string) => {
    if (!auth.token) return;

    const success = await spending.updateStatus(
      auth.token,
      requestId,
      'approved',
      reviewNotes
    );

    if (success) {
      alert('Request approved successfully!');
      // Reload requests and grants to show updated data
      spending.loadRequests(auth.token);
      grants.loadGrants(auth.token);
    }
  };

  const handleReject = async (requestId: number, reviewNotes: string) => {
    if (!auth.token) return;

    const success = await spending.updateStatus(
      auth.token,
      requestId,
      'rejected',
      reviewNotes
    );

    if (success) {
      alert('Request rejected.');
      // Reload requests
      spending.loadRequests(auth.token);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  //load grants when user logs in
  useEffect(() => {
    if (auth.token) {
      grants.loadGrants(auth.token);
    }
  }, [auth.token]);

  // ============================================================================
  // RENDER
  // ============================================================================

  //show login screen if not authenticated
  if (!auth.isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={auth.error} />;
  }

  //main app layout
  return (
    <div key={appKey} className="w-full min-h-screen bg-gradient-to-br from-darkblue to-black text-white">
      {/* Header */}
      <Header user={auth.user} onLogout={handleLogout} />

      {/* Navigation */}
      <Navigation currentView={view} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
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
          <RequestsList 
            requests={spending.requests}
            onApprove={handleApprove}
            onReject={handleReject}
            userRole={auth.user?.role}
          />
        )}
      </main>
    </div>
  );
}

export default App;