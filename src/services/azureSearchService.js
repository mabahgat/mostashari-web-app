const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const MODE_MAP = { REG: 'regulations', CASES: 'cases' };

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CACHE_KEY_PREFIX_REG = "search_cache_reg_";
const CACHE_KEY_PREFIX_CASES = "search_cache_cases_";
export const PRE_TAG = "<em>";
export const POST_TAG = "</em>";

// Get cache key prefix based on config type
const getCacheKeyPrefix = (configType = 'REG') => {
  return configType === 'CASES' ? CACHE_KEY_PREFIX_CASES : CACHE_KEY_PREFIX_REG;
};

// Get cached results
const getCachedResults = (query, configType = 'REG') => {
  try {
    const prefix = getCacheKeyPrefix(configType);
    const cacheKey = prefix + query.toLowerCase();
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      console.log("📦 Cache miss for query:", query);
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > CACHE_DURATION) {
      console.log("⏰ Cache expired for query:", query);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    const remainingTime = Math.round((CACHE_DURATION - age) / 1000 / 60);
    console.log(`✅ Cache hit for query: "${query}" (expires in ${remainingTime} minutes)`);
    return data;
  } catch (error) {
    console.error("❌ Error reading cache:", error);
    return null;
  }
};

// Store results in cache
const setCachedResults = (query, data, configType = 'REG') => {
  try {
    const prefix = getCacheKeyPrefix(configType);
    const cacheKey = prefix + query.toLowerCase();
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
    console.log(`💾 Cached results for query: "${query}"`);
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
      if (key && (key.startsWith(CACHE_KEY_PREFIX_REG) || key.startsWith(CACHE_KEY_PREFIX_CASES))) {
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

// Parse backend /search response into standardized format
const parseSearchResults = (data) => {
  if (!data || !data.results) {
    return [];
  }

  return data.results.map(({ score, captions, document }) => {
    // Extract highlights from captions — prefer highlighted version, fall back to plain text
    const caption = Array.isArray(captions) && captions.length > 0 ? captions[0] : null;
    const highlights = caption?.highlights || caption?.text || "";

    return {
      title: document.header_1 || document.header_2 || document.title || "Result",
      description: document.chunk || "",
      subtitle: document.header_2 || "",
      subtitle2: document.header_3 || "",
      source: document.title || "",
      highlights,
      score,
    };
  });
};

export const searchAzure = async (query, configType = 'REG') => {
  try {
    // Check cache first
    const cachedResults = getCachedResults(query, configType);
    if (cachedResults) {
      return cachedResults;
    }

    const mode = MODE_MAP[configType] || 'regulations';
    console.log("🔍 Search Query:", query, "| mode:", mode);

    const response = await fetch(`${BACKEND_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.VITE_BACKEND_API_KEY && {
          'X-API-Key': import.meta.env.VITE_BACKEND_API_KEY,
        }),
      },
      body: JSON.stringify({ query, mode }),
    });

    if (!response.ok) {
      console.error("❌ API Error:", response.statusText, response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Search Response received");
    console.log("📊 Total Results Count:", data.count ?? 0);
    console.log("📋 Documents in response:", data.results?.length || 0);

    // Parse and normalize results
    const results = parseSearchResults(data);

    // Cache the results
    setCachedResults(query, results, configType);

    return results;
  } catch (error) {
    console.error("❌ Error searching:", error);
    throw error;
  }
};

// Clear expired cache entries on app startup
clearExpiredCache();