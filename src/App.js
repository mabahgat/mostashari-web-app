import { useState, useEffect } from 'react';
import './App.css';
import translations from './i18n';
import { useSearch } from './hooks/useSearch';
import { SearchResults } from './components/SearchResults';

function App() {
  const [language, setLanguage] = useState('ar'); // Arabic as default
  const t = translations[language];

  // Get version from environment variable
  const appVersion = process.env.REACT_APP_VERSION || 'dev';
  const commitHash = process.env.REACT_APP_COMMIT_HASH || 'unknown';
  const branchName = process.env.REACT_APP_BRANCH_NAME || 'unknown';

  // Use search hook
  const {
    input,
    setInput,
    results,
    hasSearched,
    loading,
    error,
    handleSubmit,
    handleNewSearch,
  } = useSearch(t);

  // Update document title when language changes
  useEffect(() => {
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
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
              <SearchResults 
                results={results} 
                language={language} 
                loading={loading} 
                error={error} 
                t={t} 
              />
            </div>

            {/* Version footer */}
            <footer style={{ 
              textAlign: "center", 
              padding: "16px", 
              fontSize: "11px", 
              color: "#ccc",
              marginTop: "24px",
              borderTop: "1px solid #eee"
            }}>
              v{appVersion} • {commitHash.substring(0, 7)} • {branchName}
            </footer>
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

          {/* Version footer */}
          <footer style={{ 
            position: "fixed",
            bottom: "16px",
            left: "16px",
            fontSize: "11px", 
            color: "#ccc"
          }}>
            v{appVersion} • {commitHash.substring(0, 7)} • {branchName}
          </footer>
        </>
      )}
    </div>
  );
}

export default App;