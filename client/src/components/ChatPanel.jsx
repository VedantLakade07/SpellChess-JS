import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

const ChatPanel = ({ chatMessages, chatInput, setChatInput, onSubmit }) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="glass-panel chat-container">
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} style={{ stroke: 'var(--primary-neon)' }} />
        <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-neon)' }}>Room Chat</h3>
      </div>
      
      <div ref={chatContainerRef} className="chat-messages">
        {chatMessages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className="chat-sender">{msg.sender}:</span>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button type="submit" style={{ background: 'transparent', border: 'none', color: 'var(--primary-neon)' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
