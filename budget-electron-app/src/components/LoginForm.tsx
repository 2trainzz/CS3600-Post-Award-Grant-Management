//LoginForm Component - the login screen

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>; 
  error: string;
}

export function LoginForm({ onLogin, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    await onLogin(username, password);
    // Clearing fields
    setUsername('');
    setPassword('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    // All styling
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
              onKeyPress={handleKeyPress}
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
              onKeyPress={handleKeyPress} 
              className="w-full p-3 rounded-md bg-dark-input border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="password123"
            />
          </div>
          
          <button
            onClick={handleSubmit}
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