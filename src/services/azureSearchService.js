const AZURE_CONFIG = {
  index: "***REMOVED***",
  queryKey: "***REMOVED***",
  service: "***REMOVED***",
  dnsSuffix: "search.windows.net",
};

export const searchAzure = async (query) => {
  try {
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
    console.log("📄 Articles Array:", data.value[0]?.articles);
    console.log("📊 Articles Array Length:", data.value[0]?.articles?.length || 0);
    
    // Log each article individually
    if (data.value[0]?.articles && data.value[0].articles.length > 0) {
      console.log(`📌 Found ${data.value[0].articles.length} articles:`);
      data.value[0].articles.forEach((article, index) => {
        console.log(`Article ${index + 1}:`, article);
        console.log(`    - Title (Articles): ${article.Articles}`);
        console.log(`    - Content: ${article.content}`);
      });
    }
    
    return data.value[0]?.articles || [];
  } catch (error) {
    console.error("❌ Error searching Azure:", error);
    throw error;
  }
};