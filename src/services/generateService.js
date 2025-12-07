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
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Generate error:', error);
    throw error;
  }
};