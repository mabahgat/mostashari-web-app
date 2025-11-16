const AZURE_CONFIG = {
  index: "***REMOVED***",
  queryKey: "***REMOVED***",
  service: "***REMOVED***",
  dnsSuffix: "search.windows.net",
};

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CACHE_KEY_PREFIX = "search_cache_";

// Get cached results
const getCachedResults = (query) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + query.toLowerCase();
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
const setCachedResults = (query, data) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + query.toLowerCase();
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

export const searchAzure = async (query) => {
  try {
    // Check cache first
    const cachedResults = getCachedResults(query);
    if (cachedResults) {
      return cachedResults;
    }

    const searchUrl = `https://${AZURE_CONFIG.service}.${AZURE_CONFIG.dnsSuffix}/indexes/${AZURE_CONFIG.index}/docs/search?api-version=2021-04-30-Preview`;

    console.log("🔍 Search Query:", query);
    console.log("🌐 Search URL:", searchUrl);

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_CONFIG.queryKey,
      },
      body: JSON.stringify({
        search: query,
        count: true
      }),
    });

    if (!response.ok) {
      console.error("❌ API Error:", response.statusText, response.status);
      throw new Error(`Azure Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Full Response Data:", data);
    console.log("📊 Total Results Count:", data.value.length);
    console.log("📊 Articles Array Length:", data.value[0]?.articles?.length || 0);
    
    const results = data.value[0]?.articles || [];
    
    // Cache the results
    setCachedResults(query, results);
    
    return results;
  } catch (error) {
    console.error("❌ Error searching Azure:", error);
    throw error;
  }
};

// Clear expired cache entries on app startup
clearExpiredCache();