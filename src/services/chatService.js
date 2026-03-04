const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const SESSION_STORAGE_KEY = 'chat_session_id';

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
 * Send a chat message and get a response
 * Supports session management for multi-turn conversations
 * @param {string} message - The user message to send
 * @param {Array} previousMessages - Optional array of previous messages in the conversation
 * @returns {Promise<{response: string, sessionId: string}>} - The assistant response and session ID
 */
export const sendChatMessage = async (message, previousMessages = []) => {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty");
    }

    console.log("🔍 Sending chat message:", message.substring(0, 50) + "...");

    // Get or create session ID
    let sessionId = getStoredSessionId();
    
    // Build messages array for the API
    // Include previous messages if provided, plus the new user message
    const messages = [
      ...previousMessages,
      {
        role: 'user',
        content: message,
      },
    ];

    if (sessionId) {
      console.log("📋 Using existing session:", sessionId);
    } else {
      console.log("🆕 Creating new chat session");
    }

    const requestBody = {
      ...(sessionId && { sessionId }),
      messages,
    };

    console.log("📤 Request body:", {
      sessionId: sessionId || 'new session',
      messageCount: messages.length,
      latestMessage: message.substring(0, 50) + "...",
    });

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_BACKEND_API_KEY && {
          'x-api-key': process.env.REACT_APP_BACKEND_API_KEY,
        }),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("❌ Chat API Error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        // Session expired, clear it and retry
        console.log("⏰ Session expired, clearing and retrying...");
        clearStoredSessionId();
        // Retry without session ID
        return sendChatMessage(message, previousMessages);
      }
      
      throw new Error(
        errorData.error || `API Error: ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Store the new session ID if provided
    if (data.sessionId) {
      storeSessionId(data.sessionId);
    }

    console.log("✅ Chat response received");
    console.log("📊 Response data structure:", data);

    // Extract response text from Azure agent response format
    let responseText = '';
    
    // Handle array response format (new agent format)
    if (Array.isArray(data)) {
      console.log("📦 Response is an array with", data.length, "items");
      // Find the message object in the array
      const messageObj = data.find(item => item.type === 'message');
      console.log("🔍 Found message object:", messageObj ? 'yes' : 'no');
      
      if (messageObj && messageObj.content && Array.isArray(messageObj.content)) {
        // Extract and concatenate all text from content items
        responseText = messageObj.content
          .filter(item => item.type === 'output_text' && item.text)
          .map(item => item.text)
          .join('\n');
        console.log("✅ Extracted text from array format");
      } else {
        console.warn("⚠️ Message object or content not found in expected format");
        responseText = JSON.stringify(data, null, 2);
      }
    } else if (Array.isArray(data.output)) {
      // Output is an array - find the message object
      console.log("📦 data.output is an array with", data.output.length, "items");
      const messageObj = data.output.find(item => item.type === 'message');
      console.log("🔍 Found message object:", messageObj ? 'yes' : 'no');
      
      if (messageObj && messageObj.content && Array.isArray(messageObj.content)) {
        // Extract and concatenate all text from content items
        responseText = messageObj.content
          .filter(item => item.type === 'output_text' && item.text)
          .map(item => item.text)
          .join('\n');
        console.log("✅ Extracted text from data.output array format");
      } else {
        console.warn("⚠️ Message object or content not found in output array");
        responseText = JSON.stringify(data.output, null, 2);
      }
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      // Standard chat completion format
      responseText = data.choices[0].message.content;
      console.log("✅ Extracted text from choices format");
    } else if (data.output && typeof data.output === 'string') {
      // Output is a string
      responseText = data.output;
      console.log("✅ Extracted text from output string format");
    } else {
      console.warn("⚠️ Could not extract text from response, using full data as fallback");
      responseText = JSON.stringify(data, null, 2);
    }

    console.log("📝 Response preview:", responseText.substring(0, 100) + "...");

    return {
      response: responseText,
      sessionId: data.sessionId || undefined,
      fullData: data, // Return full data for advanced use cases
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

    const response = await fetch(`${BACKEND_URL}/api/chat/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_BACKEND_API_KEY && {
          'x-api-key': process.env.REACT_APP_BACKEND_API_KEY,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.totalSessions} active session(s)`);
    
    return data.sessions;
  } catch (error) {
    console.error('❌ Error fetching sessions:', error.message);
    throw error;
  }
};

/**
 * Delete a specific chat session
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<object>} - Deletion confirmation
 */
export const deleteSession = async (sessionId) => {
  try {
    console.log("🗑️ Deleting session:", sessionId);

    const response = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_BACKEND_API_KEY && {
          'x-api-key': process.env.REACT_APP_BACKEND_API_KEY,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Clear local storage if this is the current session
    const currentSessionId = getStoredSessionId();
    if (currentSessionId === sessionId) {
      clearStoredSessionId();
    }
    
    console.log("✅ Session deleted successfully");
    return data;
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
