import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, clearCurrentSession } from '../services/chatService';
import { ParsedChatResponse } from './ParsedChatResponse';

export const ChatContent = ({ t, language }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', closeContextMenu);
      document.addEventListener('scroll', closeContextMenu, true);
      return () => {
        document.removeEventListener('click', closeContextMenu);
        document.removeEventListener('scroll', closeContextMenu, true);
      };
    }
  }, [contextMenu, closeContextMenu]);

  const handleContextMenu = (e, text, idx) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, text, idx });
  };

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
      let conversationText = `${t.consult || 'Consult'} - ${new Date().toLocaleString()}\n`;
      conversationText += '='.repeat(50) + '\n\n';

      messages.forEach((msg, idx) => {
        const role = msg.type === 'user' ? (t.user || 'User') : (t.assistant || 'Assistant');
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
    <div className="content chat-active" style={{ 
      justifyContent: 'flex-start', 
      gap: '16px',
      flexDirection: 'column',
    }}>
      <h1 className="title">{t.appTitle}</h1>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="chat-message-row"
            style={{
              justifyContent: msg.type === 'user' ? (language === 'ar' ? 'flex-start' : 'flex-end') : (language === 'ar' ? 'flex-end' : 'flex-start'),
            }}
          >
            {msg.type === 'bot' ? (
              <div
                className="chat-bubble-wrapper"
                onContextMenu={(e) => handleContextMenu(e, msg.text, idx)}
              >
                <div className="chat-msg-actions">
                  <button
                    onClick={() => handleCopyToClipboard(msg.text)}
                    className="chat-msg-action-btn"
                    title={t.copyResponse || 'Copy response'}
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDownloadAsText(msg.text, idx)}
                    className="chat-msg-action-btn"
                    title={t.downloadResponse || 'Download response'}
                  >
                    ⬇️
                  </button>
                </div>
                <div
                  dir="auto"
                  className="chat-bubble"
                  style={{
                    backgroundColor: '#e9ecef',
                    color: '#000',
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  <ParsedChatResponse text={msg.text} />
                </div>
              </div>
            ) : (
              <div
                dir="auto"
                className="chat-bubble"
                style={{
                  backgroundColor: msg.type === 'user' ? '#007bff' : '#f8d7da',
                  color: msg.type === 'user' ? '#fff' : '#721c24',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message-row" style={{
            justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
          }}>
            <div
              dir="auto"
              className="chat-bubble"
              style={{
                backgroundColor: '#e9ecef',
                color: '#999',
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
            >
              {t.typing || 'Typing...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {contextMenu && (
        <div className="chat-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button
            className="chat-context-menu-item"
            onClick={() => { handleCopyToClipboard(contextMenu.text); setContextMenu(null); }}
          >
            📋 {t.copyResponse || 'Copy'}
          </button>
          <button
            className="chat-context-menu-item"
            onClick={() => { handleDownloadAsText(contextMenu.text, contextMenu.idx); setContextMenu(null); }}
          >
            ⬇️ {t.downloadResponse || 'Download'}
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input-bar">
        <button
          type="button"
          onClick={handleClearChat}
          className="chat-action-btn"
          title={t.newConversation || 'New Conversation'}
        >
          +
        </button>
        <textarea
          dir="auto"
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
          className={`chat-input${language === 'ar' ? ' chat-input-rtl' : ''}`}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className={`chat-send-btn${language === 'ar' ? ' chat-send-btn-rtl' : ''}`}
          title={t.send || 'Send'}
        >
          {loading ? '⏳' : '➤'}
        </button>
        <button
          type="button"
          onClick={handleDownloadConversation}
          disabled={messages.length === 0}
          className="chat-action-btn"
          title={t.downloadConversation || 'Download Conversation'}
          style={{ opacity: messages.length === 0 ? 0.4 : 1 }}
        >
          ⬇️
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
