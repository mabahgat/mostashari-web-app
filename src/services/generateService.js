const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "generate_cache_";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const getCachedResult = (prompt) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + prompt.toLowerCase();
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      console.log("📦 Cache miss for prompt:", prompt.substring(0, 50) + "...");
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > CACHE_DURATION) {
      console.log("⏰ Cache expired for prompt:", prompt.substring(0, 50) + "...");
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    const remainingTime = Math.round((CACHE_DURATION - age) / 1000 / 60 / 60);
    console.log(`✅ Cache hit for prompt (expires in ${remainingTime} hours)`);
    return data;
  } catch (error) {
    console.error("❌ Error reading cache:", error);
    return null;
  }
};

const setCachedResult = (prompt, data) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + prompt.toLowerCase();
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
    console.log(`💾 Cached result for prompt: "${prompt.substring(0, 50)}..."`);
  } catch (error) {
    console.error("❌ Error writing to cache:", error);
  }
};

const clearExpiredCache = () => {
  try {
    const now = Date.now();
    const keysToDelete = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = JSON.parse(localStorage.getItem(key));
        if (now - cached.timestamp > CACHE_DURATION) {
          keysToDelete.push(key);
        }
      }
    }
    
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed expired cache entry: ${key}`);
    });
  } catch (error) {
    console.error("❌ Error clearing expired cache:", error);
  }
};

export const generateContent = async (userInput, options = {}) => {
  try {
    const cachedResult = getCachedResult(userInput);
    if (cachedResult) {
      return cachedResult;
    }

    console.log("🔍 Generating content for prompt:", userInput.substring(0, 50) + "...");

    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_BACKEND_API_KEY,
      },
      body: JSON.stringify({
        input: userInput,
        ...options,
      }),
    });

    if (!response.ok) {
      console.error("❌ API Error:", response.statusText, response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    console.log("✅ Generate Response received");
    const data = await response.json();
    
    // Extract text from nested response structure: output -> message -> content -> output_text -> text
    const messageOutput = data.output?.find(item => item.type === 'message');
    const textContent = messageOutput?.content?.find(item => item.type === 'output_text');
    const result = textContent?.text || '';
    
    setCachedResult(userInput, result);
    
    return result;
  } catch (error) {
    console.error('❌ Generate error:', error);
    throw error;
  }
};

clearExpiredCache();