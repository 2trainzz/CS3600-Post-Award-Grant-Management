//Navigation Component the navigation tabs

import { VIEWS } from '../../config/constants';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navigation({ currentView, onNavigate }: NavigationProps) {
  const tabs = [
    { id: VIEWS.GRANTS, label: 'My Grants' },
    { id: VIEWS.CREATE, label: 'Create Request' },
    { id: VIEWS.REQUESTS, label: 'My Requests' },
  ];

  return (
    // Updated to use the dark card background, matching the header
    <nav className="bg-dark-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              // Updated styles for active and inactive tabs
              className={`px-4 py-3 font-medium transition-colors ${
                currentView === tab.id
                  // Active: White text with the 'accent' color border
                  ? 'text-white border-b-2 border-accent' 
                  // Inactive: Gray text, brightens to white on hover
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}