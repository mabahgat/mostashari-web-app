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
    <div className="generate-tab" style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#000' }}>
          {t.generateTitle || 'Generate'}
        </h2>

        <form onSubmit={handleGenerate} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
              {t.prompt || 'Enter your prompt'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.promptPlaceholder || 'Enter text here...'}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: '2px solid #FFD700',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                resize: 'vertical',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: loading ? '#ccc' : '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
            >
              {loading ? '⏳ Generating...' : t.generate || 'Generate'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#f5f5f5',
                color: '#000',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {t.clear || 'Clear'}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '24px',
              backgroundColor: '#fee',
              border: '2px solid #f00',
              borderRadius: '8px',
              color: '#c00',
            }}>
              {error}
            </div>
          )}
        </form>

        {output && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>
              {t.result || 'Result'}
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              border: '2px solid #FFD700',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              lineHeight: '1.6',
            }}>
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};