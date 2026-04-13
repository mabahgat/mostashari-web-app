const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const SESSION_STORAGE_KEY = 'chat_session_id';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(import.meta.env.VITE_BACKEND_API_KEY && {
    'X-API-Key': import.meta.env.VITE_BACKEND_API_KEY,
  }),
});

// Get stored session ID from localStorage
const getStoredSessionId = () => {
  try {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionId) {
      console.log("📋 Retrieved stored session ID:", sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error("❌ Error reading session ID from storage:", error);
    return null;
  }
};

// Store session ID in localStorage
const storeSessionId = (sessionId) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    console.log("💾 Stored session ID:", sessionId);
  } catch (error) {
    console.error("❌ Error storing session ID:", error);
  }
};

// Clear stored session ID
const clearStoredSessionId = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log("🗑️ Cleared stored session ID");
  } catch (error) {
    console.error("❌ Error clearing session ID:", error);
  }
};

/**
 * Create a new chat session on the backend.
 * @returns {Promise<{sessionId: string, clientName: string, createdAt: string, status: string}>}
 */
export const createSession = async () => {
  console.log("🆕 Creating new chat session...");

  const response = await fetch(`${BACKEND_URL}/sessions`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create session: ${response.statusText}`
    );
  }

  const data = await response.json();
  storeSessionId(data.sessionId);
  console.log("✅ Session created:", data.sessionId);
  return data;
};

/**
 * Get session details and recent messages.
 * @param {string} sessionId
 * @returns {Promise<object>} Session metadata + recentMessages array
 */
export const getSession = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to get session: ${response.statusText}`
    );
  }

  return response.json();
};

/**
 * Send a chat message and get a response.
 * A session is created automatically if none exists.
 * The backend manages full conversation history — no need to send previous messages.
 * @param {string} message - The user message to send
 * @returns {Promise<{response: string, sessionId: string, messageCount: number, lastActivityAt: string}>}
 */
export const sendChatMessage = async (message) => {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty");
    }

    console.log("🔍 Sending chat message:", message.substring(0, 50) + "...");

    // Ensure a session exists (lazy creation)
    let sessionId = getStoredSessionId();
    if (!sessionId) {
      const session = await createSession();
      sessionId = session.sessionId;
    } else {
      console.log("📋 Using existing session:", sessionId);
    }

    const response = await fetch(
      `${BACKEND_URL}/sessions/${encodeURIComponent(sessionId)}/messages`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      console.error("❌ Chat API Error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 404) {
        // Session expired or unknown — clear and retry (will create a new session)
        console.log("⏰ Session expired, clearing and retrying...");
        clearStoredSessionId();
        return sendChatMessage(message);
      }

      throw new Error(
        errorData.error?.message || errorData.error || `API Error: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("✅ Chat response received");

    return {
      response: data.reply,
      sessionId: data.sessionId,
      messageCount: data.messageCount,
      lastActivityAt: data.lastActivityAt,
    };
  } catch (error) {
    console.error('❌ Chat error:', error.message);
    throw error;
  }
};

/**
 * Get all active chat sessions from the backend
 * @returns {Promise<Array>} - Array of active sessions
 */
export const listChatSessions = async () => {
  try {
    console.log("📋 Fetching all active sessions...");

    const response = await fetch(`${BACKEND_URL}/sessions`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.total} active session(s)`);
    
    return data.sessions;
  } catch (error) {
    console.error('❌ Error fetching sessions:', error.message);
    throw error;
  }
};

/**
 * Delete a specific chat session
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<void>}
 */
export const deleteSession = async (sessionId) => {
  try {
    console.log("🗑️ Deleting session:", sessionId);

    const response = await fetch(
      `${BACKEND_URL}/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

    // Clear local storage if this is the current session
    const currentSessionId = getStoredSessionId();
    if (currentSessionId === sessionId) {
      clearStoredSessionId();
    }

    console.log("✅ Session deleted successfully");
  } catch (error) {
    console.error('❌ Error deleting session:', error.message);
    throw error;
  }
};

/**
 * Clear the current session
 */
export const clearCurrentSession = () => {
  clearStoredSessionId();
  console.log("✅ Current session cleared");
};
