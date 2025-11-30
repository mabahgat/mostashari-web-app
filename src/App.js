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
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const t = translations[language];

  // Update document title when language changes
  useEffect(() => {
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  // Calculate pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      setCurrentPage(1); // Reset to first page on new search
      
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
    setCurrentPage(1);
  };

  const handleResultsPerPageChange = (e) => {
    setResultsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of results
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const getResultContent = (result) => {
    return {
      title: result.title || "Result",
      description: result.description || "",
      subtitle: result.subtitle || "",
      subtitle2: result.subtitle2 || "",
    };
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
                  {/* Results per page selector */}
                  <div className="results-controls">
                    <label htmlFor="results-per-page">
                      {t.resultsPerPage}
                    </label>
                    <select 
                      id="results-per-page"
                      value={resultsPerPage} 
                      onChange={handleResultsPerPageChange}
                      className="results-per-page-select"
                    >
                      <option value={5}>{convertNumbers(5, language)}</option>
                      <option value={10}>{convertNumbers(10, language)}</option>
                      <option value={15}>{convertNumbers(15, language)}</option>
                      <option value={20}>{convertNumbers(20, language)}</option>
                      <option value={50}>{convertNumbers(50, language)}</option>
                    </select>
                  </div>

                  <div className="results-list">
                    <div className="result-count">
                      {t.foundResults(results.length, currentPage, totalPages)}
                    </div>
                    {currentResults.map((result, index) => {
                      const content = getResultContent(result);
                      return (
                        <div key={startIndex + index} className="result-item">
                          <h4>{content.title}</h4>
                          {content.subtitle && (
                            <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                              {content.subtitle}
                            </p>
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

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        {language === 'ar' ? '«' : '«'}
                      </button>

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        {language === 'ar' ? '›' : '‹'}
                      </button>

                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {convertNumbers(pageNum, language)}
                        </button>
                      ))}

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        {language === 'ar' ? '‹' : '›'}
                      </button>

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        {language === 'ar' ? '»' : '»'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!loading && results.length === 0 && !error && (
                <div className="no-results">
                  <p>{t.noResults}</p>
                </div>
              )}
            </div>
          </div>
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
        </>
      )}
    </div>
  );
}

export default App;