export const sessionStore = new Map();

export function getUserSession(sessionToken) {
  return sessionStore.get(sessionToken);
}

export function setUserSession(sessionToken, sessionData) {
  sessionStore.set(sessionToken, sessionData);
}

export function updateUserSession(sessionToken, updates) {
  const existing = sessionStore.get(sessionToken) || {};
  sessionStore.set(sessionToken, { ...existing, ...updates });
}

export function deleteUserSession(sessionToken) {
  sessionStore.delete(sessionToken);
}

export function getSessionCount() {
  return sessionStore.size;
}
