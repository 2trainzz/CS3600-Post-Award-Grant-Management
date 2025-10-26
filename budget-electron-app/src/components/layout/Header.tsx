//Header Component - the top header bar

import type { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-dark-card text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grant Management</h1>
          {user && (
            <p className="text-gray-400 text-sm">
              Welcome, {user.firstName} {user.lastName}
            </p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}