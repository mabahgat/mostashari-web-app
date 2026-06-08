import { useState, useEffect } from 'react';
import './App.css';
import translations from './i18n';
import { useSearch } from './hooks/useSearch';
import { SearchContent } from './components/SearchContent';
import { ChatContent } from './components/ChatContent';
import { getModelInfo } from './services/modelService';

const RTL_LANG_PREFIXES = ['ar', 'fa', 'he', 'ur', 'ps', 'dv', 'ku', 'yi'];

const isRtlLanguage = (lang) => {
  if (!lang) return false;
  return RTL_LANG_PREFIXES.some((prefix) => lang.toLowerCase().startsWith(prefix));
};

function App() {
  const [language, setLanguage] = useState('ar');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'regulations', or 'cases'
  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  const appVersion = import.meta.env.VITE_VERSION || 'dev';
  const commitHash = import.meta.env.VITE_COMMIT_HASH || 'unknown';
  const branchName = import.meta.env.VITE_BRANCH_NAME || 'unknown';

  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    getModelInfo()
      .then((info) => setModelInfo(info))
      .catch(() => {});
  }, []);

  const {
    input: regulationsInput,
    setInput: setRegulationsInput,
    results: regulationsResults,
    hasSearched: regulationsHasSearched,
    loading: regulationsLoading,
    error: regulationsError,
    handleSubmit: regulationsHandleSubmit,
    handleNewSearch: regulationsHandleNewSearch,
  } = useSearch(t, 'REG');

  const {
    input: casesInput,
    setInput: setCasesInput,
    results: casesResults,
    hasSearched: casesHasSearched,
    loading: casesLoading,
    error: casesError,
    handleSubmit: casesHandleSubmit,
    handleNewSearch: casesHandleNewSearch,
  } = useSearch(t, 'CASES');

  useEffect(() => {
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const getTabContainerStyle = () => ({
    display: 'flex',
    gap: '0',
    justifyContent: 'flex-start',
    direction: isRtl ? 'rtl' : 'ltr',
    flexWrap: 'wrap',
    borderBottom: 'none',
    position: 'sticky',
    top: '0',
    zIndex: 100,
    backgroundColor: '#ffffff',
    width: '100%',
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
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
    <div className="App" dir={isRtl ? 'rtl' : 'ltr'}>
      <button className="language-toggle" onClick={toggleLanguage}>
        {language === 'ar' ? 'EN' : 'العربية'}
      </button>

      {(regulationsHasSearched && activeTab === 'regulations') || (casesHasSearched && activeTab === 'cases') ? (
        <>
          {/* Search bar moved to top */}
          <div className="top-search-container">
            <div className="search-form-top" style={{ gap: '12px', padding: '12px' }}>
              <input
                type="text"
                value={activeTab === 'regulations' ? regulationsInput : casesInput}
                onChange={(e) => activeTab === 'regulations' ? setRegulationsInput(e.target.value) : setCasesInput(e.target.value)}
                placeholder={t.placeholder}
                className="search-input-top"
              />
              <button 
                type="submit" 
                className="search-button-top" 
                disabled={activeTab === 'regulations' ? regulationsLoading : casesLoading} 
                onClick={activeTab === 'regulations' ? regulationsHandleSubmit : casesHandleSubmit}
              >
                {(activeTab === 'regulations' ? regulationsLoading : casesLoading) ? '⏳' : t.button}
              </button>
              <button 
                type="button" 
                className="new-search-button"
                onClick={activeTab === 'regulations' ? regulationsHandleNewSearch : casesHandleNewSearch}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Results section */}
          <div className="results-container">
            <div className="results-wrapper">
              <SearchContent 
                results={activeTab === 'regulations' ? regulationsResults : casesResults} 
                language={language} 
                loading={activeTab === 'regulations' ? regulationsLoading : casesLoading} 
                error={activeTab === 'regulations' ? regulationsError : casesError} 
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
                onClick={() => setActiveTab('chat')}
                style={getTabButtonStyle(activeTab === 'chat', isRtl ? 'left' : 'right')}
              >
                {t.consult || 'Consult'}
              </button>
              <button
                onClick={() => setActiveTab('regulations')}
                style={getTabButtonStyle(activeTab === 'regulations', isRtl ? 'right' : 'left')}
              >
                {t.regulationsSearch || 'Regulations Search'}
              </button>
              <button
                onClick={() => setActiveTab('cases')}
                style={getTabButtonStyle(activeTab === 'cases', 'center')}
              >
                {t.casesSearch || 'Cases Search'}
              </button>
            </div>

            {/* Tab content */}
            <div style={{ display: activeTab === 'regulations' ? 'block' : 'none' }}>
              <div className="content">
                <h1 className="title">{t.appTitle}</h1>
                
                <form onSubmit={regulationsHandleSubmit} className="search-form">
                  <input
                    type="text"
                    value={regulationsInput}
                    onChange={(e) => setRegulationsInput(e.target.value)}
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
            <div style={{ display: activeTab === 'cases' ? 'block' : 'none' }}>
              <div className="content">
                <h1 className="title">{t.appTitle}</h1>
                
                <form onSubmit={casesHandleSubmit} className="search-form">
                  <input
                    type="text"
                    value={casesInput}
                    onChange={(e) => setCasesInput(e.target.value)}
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
            <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
              <ChatContent t={t} language={language} />
            </div>
          </div>
        </>
      )}
      {/* Version footer */}
      <footer className="footer">
        v{appVersion} • {commitHash.substring(0, 7)} • {branchName}
        {modelInfo && ` • ${modelInfo.name} v${modelInfo.version}`}
      </footer>
    </div>
  );
}

export default App;