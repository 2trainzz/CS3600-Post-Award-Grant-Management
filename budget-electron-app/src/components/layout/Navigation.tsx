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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                currentView === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
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