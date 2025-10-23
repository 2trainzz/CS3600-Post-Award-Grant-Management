/**
 * Session Manager
 * 
 * Extracted from your original server.ts
 * Manages in-memory sessions (same as before)
 */

// In-memory session storage: token -> userId
const sessions = new Map<string, number>();

/**
 * Generate a simple random token
 * (Same as your original implementation)
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create a new session for a user
 * Returns the generated token
 */
function createSession(userId: number): string {
  const token = generateToken();
  sessions.set(token, userId);
  return token;
}

/**
 * Get user ID from a token
 * Returns null if token doesn't exist
 */
function getUserIdFromToken(token: string): number | null {
  return sessions.get(token) || null;
}

/**
 * Delete a session (logout)
 */
function deleteSession(token: string): void {
  sessions.delete(token);
}

/**
 * Check if a token is valid
 */
function isValidToken(token: string): boolean {
  return sessions.has(token);
}

// Export all functions
export {
  generateToken,
  createSession,
  getUserIdFromToken,
  deleteSession,
  isValidToken,
  sessions // Export the Map if needed for debugging
};