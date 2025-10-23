/**
 * Header Component
 * 
 * Extracted from App.tsx - the top header bar
 * Same UI, just in its own component
 */

import type { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grant Management</h1>
          {user && (
            <p className="text-indigo-200 text-sm">
              Welcome, {user.firstName} {user.lastName}
            </p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}