import { useState } from 'react';
import { generateContent } from '../services/generateService';

export const GenerateCase = ({ t, language }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const result = await generateContent(input);
      setOutput(result);
    } catch (err) {
      setError(err.message || 'Error generating response');
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="content" style={{ justifyContent: 'center', gap: '30px' }}>
      <h1 className="title">{t.appTitle}</h1>

      <form onSubmit={handleGenerate} className="search-form" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.promptPlaceholder || 'Enter text here...'}
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '320px',
            padding: '18px 24px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            resize: 'vertical',
            boxSizing: 'border-box',
            opacity: loading ? 0.6 : 1,
            backgroundColor: 'white',
            color: '#333',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#FFD700';
            e.target.style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e0e0e0';
            e.target.style.boxShadow = 'none';
          }}
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="search-button"
            style={{
              opacity: loading || !input.trim() ? 0.6 : 1,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Generating...' : t.generate || 'Generate'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: '18px 32px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#f5f5f5',
              color: '#000',
              border: '2px solid #e0e0e0',
              borderRadius: '50px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {t.clear || 'Clear'}
          </button>
        </div>
      </form>

      {output && (
        <div style={{
          width: '100%',
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px solid #e0e0e0',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          color: '#333',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#000', fontSize: '16px', fontWeight: '600' }}>
            {t.result || 'Result'}
          </h3>
          {output}
        </div>
      )}

      {error && (
        <div style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#ffe0e0',
          borderRadius: '8px',
          border: '2px solid #ff6b6b',
          color: '#cc0000',
          fontSize: '14px',
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};