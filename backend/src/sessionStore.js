import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis'));

await redisClient.connect();

const SESSION_TTL = 24 * 60 * 60; // 24 hours

export async function getUserSession(sessionToken) {
  try {
    const data = await redisClient.get(`session:${sessionToken}`);
    return data ? JSON.parse(data) : undefined;
  } catch (error) {
    console.error('Error getting session:', error);
    return undefined;
  }
}

export async function setUserSession(sessionToken, sessionData) {
  try {
    await redisClient.setEx(
      `session:${sessionToken}`,
      SESSION_TTL,
      JSON.stringify(sessionData)
    );
  } catch (error) {
    console.error('Error setting session:', error);
  }
}

export async function updateUserSession(sessionToken, updates) {
  try {
    const existing = await getUserSession(sessionToken);
    const updated = { ...existing, ...updates };
    await setUserSession(sessionToken, updated);
  } catch (error) {
    console.error('Error updating session:', error);
  }
}

export async function deleteUserSession(sessionToken) {
  try {
    await redisClient.del(`session:${sessionToken}`);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

export async function getSessionCount() {
  try {
    const keys = await redisClient.keys('session:*');
    return keys.length;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
}
