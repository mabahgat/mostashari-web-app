import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, clearCurrentSession } from '../services/chatService';

export const ChatContent = ({ t, language }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);

    try {
      // Send message — the backend manages conversation history per session
      const result = await sendChatMessage(userMessage);
      
      // Extract response from the returned object
      const assistantResponse = result.response;
      
      // Add bot response to chat
      setMessages(prev => [...prev, { type: 'bot', text: assistantResponse }]);
    } catch (err) {
      setError(err.message || 'Error sending message');
      console.error('Chat error:', err);
      // Add error message to chat
      setMessages(prev => [...prev, { type: 'error', text: err.message || 'Error sending message' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
    clearCurrentSession();
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Copied to clipboard');
    } catch (err) {
      console.error('❌ Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadAsText = (text, index) => {
    try {
      const element = document.createElement('a');
      const file = new Blob([text], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `response-${index}-${new Date().getTime()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      console.log('✅ Downloaded response as text file');
    } catch (err) {
      console.error('❌ Failed to download file:', err);
    }
  };

  const handleDownloadConversation = () => {
    try {
      let conversationText = `${t.chat || 'Chat'} - ${new Date().toLocaleString()}\n`;
      conversationText += '='.repeat(50) + '\n\n';

      messages.forEach((msg, idx) => {
        const role = msg.type === 'user' ? (t.send || 'User') : (t.chat || 'Assistant');
        conversationText += `${idx + 1}. ${role}:\n`;
        conversationText += msg.text + '\n\n';
      });

      const element = document.createElement('a');
      const file = new Blob([conversationText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `conversation-${new Date().getTime()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      console.log('✅ Downloaded conversation as text file');
    } catch (err) {
      console.error('❌ Failed to download conversation:', err);
    }
  };

  const hasMessages = messages.length > 0;

  if (!hasMessages) {
    // Initial view - same as Generate
    return (
      <div className="content" style={{ justifyContent: 'center', gap: '30px' }}>
        <h1 className="title">{t.appTitle}</h1>

        <form onSubmit={handleSendMessage} className="search-form" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder || 'Type your message...'}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendMessage(e);
              }
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
              {loading ? '⏳ Sending...' : t.send || 'Send'}
            </button>

            <button
              type="button"
              onClick={handleClearChat}
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
  }

  // Chat view - after first message
  return (
    <div className="content" style={{ 
      justifyContent: 'flex-start', 
      gap: '16px',
      flexDirection: 'column',
      padding: '20px 0',
      paddingBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
      }}>
        <h1 className="title" style={{ margin: 0 }}>{t.chat || 'Chat'}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDownloadConversation}
            disabled={messages.length === 0}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: messages.length === 0 ? '#e0e0e0' : '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: messages.length === 0 ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (messages.length > 0) {
                e.target.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = messages.length === 0 ? '#e0e0e0' : '#f0f0f0';
            }}
            title={t.downloadConversation || 'Download Conversation'}
          >
            ⬇️ {t.downloadConversation || 'Download'}
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
          >
            + {t.newConversation || 'New Conversation'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        maxHeight: 'calc(100vh - 450px)',
        minHeight: '300px',
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        width: '100%',
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.type === 'user' ? (language === 'ar' ? 'flex-start' : 'flex-end') : (language === 'ar' ? 'flex-end' : 'flex-start'),
              marginBottom: '8px',
              position: 'relative',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.type === 'user' ? '#007bff' : msg.type === 'error' ? '#f8d7da' : '#e9ecef',
                color: msg.type === 'user' ? '#fff' : msg.type === 'error' ? '#721c24' : '#000',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </div>
            {msg.type === 'bot' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexDirection: 'column',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <button
                  onClick={() => handleCopyToClipboard(msg.text)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    minWidth: '30px',
                    textAlign: 'center',
                  }}
                  title={t.copyResponse || 'Copy response'}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e0e0e0';
                    e.target.style.borderColor = '#ccc';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  📋
                </button>
                <button
                  onClick={() => handleDownloadAsText(msg.text, idx)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    minWidth: '30px',
                    textAlign: 'center',
                  }}
                  title={t.downloadResponse || 'Download response'}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e0e0e0';
                    e.target.style.borderColor = '#ccc';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  ⬇️
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
            marginBottom: '8px',
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#e9ecef',
              color: '#999',
            }}>
              {t.typing || 'Typing...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSendMessage} 
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          width: '100%',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder={t.chatPlaceholder || 'Type your message...'}
          disabled={loading}
          style={{
            flex: 1,
            minHeight: '44px',
            maxHeight: '120px',
            padding: '12px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
            fontWeight: '400',
            boxSizing: 'border-box',
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !input.trim() ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'background-color 0.2s ease',
            minWidth: '80px',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '⏳' : t.send || 'Send'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          borderLeft: '4px solid #f5c6cb',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
