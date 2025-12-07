import { useState, useEffect } from 'react';
import './App.css';
import translations from './i18n';
import { useSearch } from './hooks/useSearch';
import { SearchContent } from './components/SearchContent';
import { GenerateCase } from './components/GenerateCase';

function App() {
  const [language, setLanguage] = useState('ar');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'generate'
  const t = translations[language];

  const appVersion = process.env.REACT_APP_VERSION || 'dev';
  const commitHash = process.env.REACT_APP_COMMIT_HASH || 'unknown';
  const branchName = process.env.REACT_APP_BRANCH_NAME || 'unknown';

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

  useEffect(() => {
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <div className="App" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {!hasSearched && activeTab === 'search' && (
        <button className="language-toggle" onClick={toggleLanguage}>
          {language === 'ar' ? 'EN' : 'العربية'}
        </button>
      )}

      {hasSearched && activeTab === 'search' ? (
        <>
          {/* Search bar moved to top */}
          <div className="top-search-container">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
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
              <button type="submit" className="search-button-top" disabled={loading} onClick={handleSubmit}>
                {loading ? '⏳' : t.button}
              </button>
              <button 
                type="button" 
                className="new-search-button"
                onClick={handleNewSearch}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Results section */}
          <div className="results-container">
            <div className="results-wrapper">
              <SearchContent 
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
          {/* Initial view with tabs */}
          <div className="container">
            {/* Tab buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center', 
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setActiveTab('search')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: activeTab === 'search' ? '#FFD700' : '#f5f5f5',
                  color: '#000',
                  border: activeTab === 'search' ? '2px solid #FFC700' : '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {t.search || 'Search'}
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: activeTab === 'generate' ? '#FFD700' : '#f5f5f5',
                  color: '#000',
                  border: activeTab === 'generate' ? '2px solid #FFC700' : '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {t.generate || 'Generate'}
              </button>
            </div>

            {/* Language toggle */}
            <button 
              className="language-toggle" 
              onClick={toggleLanguage}
              style={{ top: '16px' }}
            >
              {language === 'ar' ? 'EN' : 'العربية'}
            </button>

            {/* Tab content */}
            {activeTab === 'search' ? (
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
            ) : (
              <GenerateCase t={t} language={language} />
            )}
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