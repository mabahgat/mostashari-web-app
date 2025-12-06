import { useState, useEffect } from 'react';
import './App.css';
import translations, { convertNumbers } from './i18n';
import { searchAzure, PRE_TAG, POST_TAG } from './services/azureSearchService';

function App() {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('ar'); // Arabic as default
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const t = translations[language];

  // Get version from environment variable or package.json
  const appVersion = process.env.REACT_APP_VERSION || 'dev';
  const commitHash = process.env.REACT_APP_COMMIT_HASH || 'unknown';

  // Update document title when language changes
  useEffect(() => {
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      setLoading(true);
      setError(null);
      setResults([]); // Reset results before search
      setHasSearched(true);
      
      try {
        const searchResults = await searchAzure(input);
        setResults(searchResults);
        console.log('Search results:', searchResults);
      } catch (err) {
        setError(t.errorMessage);
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleNewSearch = () => {
    setInput('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  const getResultContent = (result) => {
    return {
      title: result.title || "Result",
      description: result.description || "",
      subtitle: result.subtitle || "",
      subtitle2: result.subtitle2 || "",
    };
  };

  return (
    <div className="App" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {!hasSearched && (
        <button className="language-toggle" onClick={toggleLanguage}>
          {language === 'ar' ? 'EN' : 'العربية'}
        </button>
      )}

      {hasSearched ? (
        <>
          {/* Search bar moved to top */}
          <div className="top-search-container">
            <form onSubmit={handleSubmit} className="search-form-top">
              <button 
                type="button" 
                className="language-toggle-top"
                onClick={toggleLanguage}
              >
                {language === 'ar' ? 'EN' : 'العربية'}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="search-input-top"
              />
              <button type="submit" className="search-button-top" disabled={loading}>
                {loading ? '⏳' : t.button}
              </button>
              <button 
                type="button" 
                className="new-search-button"
                onClick={handleNewSearch}
              >
                ✕
              </button>
            </form>
          </div>

          {/* Results section */}
          <div className="results-container">
            <div className="results-wrapper">
              {loading && (
                <div className="loading">
                  <p>{t.searchingMessage}</p>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <>
                  <div className="results-list">
                    <div className="result-count">
                      {t.foundResults(convertNumbers(results.length, language))}
                    </div>
                    {(() => {
                      // Group results by title
                      const grouped = {};
                      results.forEach((result) => {
                        const title = result.title || "Unknown";
                        if (!grouped[title]) {
                          grouped[title] = [];
                        }
                        grouped[title].push(result);
                      });

                      return Object.entries(grouped).map(([title, items], groupIndex) => (
                        <details key={groupIndex} style={{ marginBottom: "24px", border: "2px solid #FFD700", borderRadius: "12px", padding: "0" }}>
                          <summary style={{ fontSize: "16px", fontWeight: "700", color: "#000", paddingBottom: "8px", padding: "12px", cursor: "pointer", borderBottom: "2px solid #FFD700", backgroundColor: "#fffef5" }}>
                            {title} <span style={{ fontSize: "14px", color: "#666", fontWeight: "400" }}>({convertNumbers(items.length, language)})</span>
                          </summary>
                          <div style={{ padding: "12px" }}>
                            {items.map((result, itemIndex) => {
                              const content = getResultContent(result);
                              return (
                                <div key={itemIndex} className="result-item" style={{ marginBottom: "12px" }}>
                                  {content.subtitle && (
                                    <h4 style={{ margin: "0 0 12px 0", color: "#000", fontSize: "18px", fontWeight: "600", borderBottom: "2px solid #FFD700", paddingBottom: "8px" }}>
                                      {content.subtitle}
                                    </h4>
                                  )}
                                  {content.subtitle2 && (
                                    <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                                      {content.subtitle2}
                                    </p>
                                  )}
                                  <p>{content.description}</p>
                                  
                                  {/* Search Hit Details */}
                                  <details style={{ marginTop: "12px", fontSize: "11px", color: "#999", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <summary style={{ cursor: "pointer", fontWeight: "600", color: "#666" }}>
                                      {t.searchHit}
                                    </summary>
                                    <pre style={{ backgroundColor: "#f5f5f5", padding: "8px", borderRadius: "4px", overflow: "auto", maxHeight: "200px", fontSize: "10px", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                                      {(() => {
                                        const jsonStr = JSON.stringify(result.highlights, null, 2);
                                        const preTagRegex = new RegExp(PRE_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
                                        const postTagRegex = new RegExp(POST_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
                                        
                                        return jsonStr
                                          .split(new RegExp(`(${PRE_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${POST_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g"))
                                          .map((part, idx) => {
                                            if (part.includes(PRE_TAG) && part.includes(POST_TAG)) {
                                              const content = part.replace(preTagRegex, "").replace(postTagRegex, "");
                                              return <span key={idx} style={{ backgroundColor: "#FFFF00", fontWeight: "bold" }}>{content}</span>;
                                            }
                                            return <span key={idx}>{part}</span>;
                                          });
                                      })()}
                                    </pre>
                                  </details>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      ));
                    })()}
                  </div>
                </>
              )}

              {!loading && results.length === 0 && !error && (
                <div className="no-results">
                  <p>{t.noResults}</p>
                </div>
              )}
            </div>
          </div>

          {/* Version footer */}
          <footer style={{ 
            textAlign: "center", 
            padding: "16px", 
            fontSize: "11px", 
            color: "#ccc",
            marginTop: "24px"
          }}>
            v{appVersion} • {commitHash.substring(0, 7)}
          </footer>
        </>
      ) : (
        <>
          {/* Initial centered search */}
          <div className="container">
            <div className="content">
              <h1 className="title">{t.appTitle}</h1>
              
              <form onSubmit={handleSubmit} className="search-form">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="search-input"
                  autoFocus
                />
                <button type="submit" className="search-button">
                  {t.button}
                </button>
              </form>
            </div>
          </div>

          {/* Version footer */}
          <footer style={{ 
            position: "fixed",
            bottom: "16px",
            left: "16px",
            fontSize: "11px", 
            color: "#ccc"
          }}>
            v{appVersion} • {commitHash.substring(0, 7)}
          </footer>
        </>
      )}
    </div>
  );
}

export default App;