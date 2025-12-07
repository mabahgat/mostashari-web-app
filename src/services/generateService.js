const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY_PREFIX = "generate_cache_";

const AZURE_CONFIG = {
  endpoint: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || 'https://az-openai-law-1.openai.azure.com/',
  apiKey: process.env.REACT_APP_AZURE_OPENAI_API_KEY,
  deployment: process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
  apiVersion: process.env.REACT_APP_AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
  agentInstructions: process.env.REACT_APP_AZURE_OPENAI_AGENT_INSTRUCTIONS,
};

// Validate that required environment variables are set
if (!AZURE_CONFIG.apiKey || !AZURE_CONFIG.agentInstructions) {
  console.error("❌ Missing required Azure OpenAI configuration. Check your .env.local file.");
  console.error("   Required: REACT_APP_AZURE_OPENAI_API_KEY, REACT_APP_AZURE_OPENAI_AGENT_INSTRUCTIONS");
}

// Get cached result
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

// Store result in cache
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
    // Continue without caching if localStorage fails
  }
};

// Clear expired cache entries
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

export const generateContent = async (prompt, options = {}) => {
  const {
    maxTokens = 6553,
    temperature = 0.7,
    topP = 0.95,
    frequencyPenalty = 0,
    presencePenalty = 0,
    systemMessage = AZURE_CONFIG.agentInstructions,
  } = options;

  try {
    // Check cache first
    const cachedResult = getCachedResult(prompt);
    if (cachedResult) {
      return cachedResult;
    }

    console.log("🔍 Generating content for prompt:", prompt.substring(0, 50) + "...");

    const response = await fetch(
      `${AZURE_CONFIG.endpoint}openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_CONFIG.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
        }),
      }
    );

    if (!response.ok) {
      console.error("❌ API Error:", response.statusText, response.status);
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate content');
    }

    console.log("✅ Generate Response received");
    const data = await response.json();
    
    console.log(`📊 Tokens used - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`);
    
    const result = data.choices[0].message.content;
    
    // Cache the result
    setCachedResult(prompt, result);
    
    return result;
  } catch (error) {
    console.error('❌ Generate error:', error);
    throw error;
  }
};

// Clear expired cache entries on app startup
clearExpiredCache();