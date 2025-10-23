//sessionManager - Manages in-memory sessions

// In-memory session storage: token -> userId
const sessions = new Map<string, number>();

//generate simple random token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

//create new session for user & return generated token

function createSession(userId: number): string {
  const token = generateToken();
  sessions.set(token, userId);
  return token;
}

//get user ID from a token, return null if token doesn't exist
function getUserIdFromToken(token: string): number | null {
  return sessions.get(token) || null;
}

//delete session (logout)
function deleteSession(token: string): void {
  sessions.delete(token);
}

//check token is valid
function isValidToken(token: string): boolean {
  return sessions.has(token);
}


export {
  generateToken,
  createSession,
  getUserIdFromToken,
  deleteSession,
  isValidToken,
  sessions // Export the Map if needed for debugging
};