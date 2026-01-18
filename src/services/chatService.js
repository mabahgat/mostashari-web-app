const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "chat_cache_";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Normalize whitespace to avoid cache misses due to extra spaces, line breaks, tabs, etc.
const normalizeWhitespace = (text) => {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
};

const getCachedResult = (message) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + normalizeWhitespace(message);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      console.log("📦 Chat cache miss for message:", message.substring(0, 50) + "...");
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > CACHE_DURATION) {
      console.log("⏰ Chat cache expired for message:", message.substring(0, 50) + "...");
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    const remainingTime = Math.round((CACHE_DURATION - age) / 1000 / 60 / 60);
    console.log(`✅ Chat cache hit for message (expires in ${remainingTime} hours)`);
    return data;
  } catch (error) {
    console.error("❌ Error reading chat cache:", error);
    return null;
  }
};

const setCachedResult = (message, data) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + normalizeWhitespace(message);
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
    console.log(`💾 Cached chat result for message: "${message.substring(0, 50)}..."`);
  } catch (error) {
    console.error("❌ Error writing to chat cache:", error);
  }
};

export const sendChatMessage = async (message) => {
  try {
    const cachedResult = getCachedResult(message);
    if (cachedResult) {
      return cachedResult;
    }

    console.log("🔍 Sending chat message:", message.substring(0, 50) + "...");

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_BACKEND_API_KEY,
      },
      body: JSON.stringify({
        message: message,
      }),
    });

    if (!response.ok) {
      console.error("❌ Chat API Error:", response.statusText, response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    console.log("✅ Chat response received");
    const data = await response.json();
    
    // Extract text from nested response structure
    const messageOutput = data.output?.find(item => item.type === 'message');
    const textContent = messageOutput?.content?.find(item => item.type === 'output_text');
    const result = textContent?.text || '';
    
    setCachedResult(message, result);
    
    return result;
  } catch (error) {
    console.error('❌ Chat error:', error);
    throw error;
  }
};
