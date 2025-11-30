const AZURE_CONFIG = {
  index: process.env.REACT_APP_AZURE_SEARCH_INDEX,
  queryKey: process.env.REACT_APP_AZURE_SEARCH_KEY,
  service: process.env.REACT_APP_AZURE_SEARCH_SERVICE,
  dnsSuffix: process.env.REACT_APP_AZURE_DNS_SUFFIX || "search.windows.net",
  semanticConfiguration: process.env.REACT_APP_AZURE_SEMANTIC_CONFIG || "rag-md-2-semantic-configuration-2",
};

// Validate that required environment variables are set
if (!AZURE_CONFIG.service || !AZURE_CONFIG.index || !AZURE_CONFIG.queryKey) {
  console.error("❌ Missing required Azure Search configuration. Check your .env.local file.");
}

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CACHE_KEY_PREFIX = "search_cache_";
const PRE_TAG = "<em>";
const POST_TAG = "</em>";

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

// Parse API response into standardized format
const parseSearchResults = (data) => {
  if (!data || !data.value) {
    return [];
  }

  return data.value.map((item) => {
    // Extract highlights text from captions if available
    let highlightText = "";
    let chunkWithHighlights = item.chunk || "";
    
    if (item["@search.captions"] && item["@search.captions"].length > 0) {
      highlightText = item["@search.captions"][0].highlights || item["@search.captions"][0].text || "";
      
      // If we have highlights, extract the highlighted terms and apply them to chunk
      if (highlightText && item.chunk) {
        // Find all text between PRE_TAG and POST_TAG in highlights
        const regex = new RegExp(`${PRE_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^<]+?)${POST_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
        let match;
        const highlightedTerms = new Set();
        
        while ((match = regex.exec(highlightText)) !== null) {
          highlightedTerms.add(match[1]);
        }
        
        // Apply highlights to chunk for each highlighted term
        highlightedTerms.forEach((term) => {
          // Escape special regex characters and replace exact matches (including surrounding spaces/punctuation)
          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const termRegex = new RegExp(escapedTerm, "g");
          chunkWithHighlights = chunkWithHighlights.replace(termRegex, `${PRE_TAG}${term}${POST_TAG}`);
        });
      }
    }

    return {
      title: item.header_1 || item.header_2 || item.title || "Result",
      description: chunkWithHighlights,
      subtitle: item.header_2 || "",
      source: item.title || "",
      highlights: highlightText,
      score: item["@search.score"],
      rerankerScore: item["@search.rerankerScore"],
    };
  });
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

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_CONFIG.queryKey,
      },
      body: JSON.stringify({
        search: query,
        count: true,
        queryType: "semantic",
        semanticConfiguration: AZURE_CONFIG.semanticConfiguration,
        captions: "extractive",
        queryLanguage: "ar-SA",
        searchFields: "header_1,chunk",
        select: "chunk_id,parent_id,chunk,title,header_1,header_2",
        highlightPreTag: PRE_TAG,
        highlightPostTag: POST_TAG,
      }),
    });

    if (!response.ok) {
      console.error("❌ API Error:", response.statusText, response.status);
      throw new Error(`Azure Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Search Response received");
    console.log("📊 Total Results Count:", data["@odata.count"] || 0);
    console.log("📋 Documents in response:", data.value?.length || 0);
    
    // Parse and normalize results
    const results = parseSearchResults(data);
    
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