import { useState, useEffect } from 'react';
import './App.css';
import translations from './i18n';
import { useSearch } from './hooks/useSearch';
import { SearchContent } from './components/SearchContent';
import { GenerateCase } from './components/GenerateCase';
import { ChatContent } from './components/ChatContent';

function App() {
  const [language, setLanguage] = useState('ar');
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'generate', or 'chat'
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

  const getTabContainerStyle = () => ({
    display: 'flex',
    gap: '0',
    justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    padding: '0',
    borderBottom: '1px solid #e0e0e0',
  });

  const getTabButtonStyle = (isActive, position) => ({
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '400',
    backgroundColor: 'transparent',
    color: isActive ? '#000' : '#999',
    border: 'none',
    borderBottom: isActive ? '2px solid #000' : '2px solid transparent',
    borderRadius: '0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    margin: '0',
    marginBottom: '-1px',
  });

  return (
    <div className="App" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <button className="language-toggle" onClick={toggleLanguage}>
        {language === 'ar' ? 'EN' : 'العربية'}
      </button>

      {hasSearched && activeTab === 'search' ? (
        <>
          {/* Search bar moved to top */}
          <div className="top-search-container">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
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
          </div>
        </>
      ) : (
        <>

          {/* Tabs above content */}
          <div className="container">
            <div style={getTabContainerStyle()}>
              <button
                onClick={() => setActiveTab('search')}
                style={getTabButtonStyle(activeTab === 'search', language === 'ar' ? 'right' : 'left')}
              >
                {t.search || 'Search'}
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                style={getTabButtonStyle(activeTab === 'generate', language === 'ar' ? 'left' : 'right')}
              >
                {t.generate || 'Generate'}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                style={getTabButtonStyle(activeTab === 'chat', language === 'ar' ? 'left' : 'right')}
              >
                {t.chat || 'Chat'}
              </button>
            </div>

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
            ) : activeTab === 'generate' ? (
              <GenerateCase t={t} language={language} />
            ) : (
              <ChatContent t={t} language={language} />
            )}
          </div>
        </>
      )}
      {/* Version footer */}
      <footer className="footer">
        v{appVersion} • {commitHash.substring(0, 7)} • {branchName}
      </footer>
    </div>
  );
}

export default App;