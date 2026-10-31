import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, fetchSuggestedQuestions, SuggestedQuestion, SourceCitation } from '../services/api';
import '../styles/chatbot.css';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: SourceCitation[];
  links?: { label: string; url: string }[];
  requiresLogin?: boolean;
}

export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      sender: 'bot',
      text: "Hello! Welcome to TRR Group of Institutions. How can I assist you with admissions, courses, or timings?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestedQuestions().then((q) => setSuggestedQuestions(q.slice(0, 4)));
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: Message = { id: 'u-' + Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: (m.sender === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await sendChatMessage(text, history);
      setMessages((prev) => [
        ...prev,
        {
          id: 'b-' + Date.now(),
          sender: 'bot',
          text: res.answer,
          sources: res.sources,
          links: res.links,
          requiresLogin: res.requiresLogin,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'b-' + Date.now(),
          sender: 'bot',
          text: 'Sorry, I had trouble connecting. Please try again or call the help desk at 9154364306.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999 }}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #2E56DD, #58c1F8)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 22px',
            boxShadow: '0 8px 24px rgba(46, 86, 221, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '15px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(46, 86, 221, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 86, 221, 0.4)';
          }}
          title="Chat with TRR AI Assistant"
        >
          <span style={{ fontSize: '20px' }}>💬</span>
          <span>Ask TRR AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            maxWidth: '92vw',
            height: '520px',
            maxHeight: '82vh',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(to right, #2E56DD, #58c1F8)',
              color: 'white',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>SMART-CONNECT AI</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>TRR Group of Institutions Assistant</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f8fafc', fontSize: '14px' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.sender === 'user' ? 'linear-gradient(to bottom right, #2E56DD, #58c1F8)' : '#ffffff',
                    color: m.sender === 'user' ? 'white' : '#1e293b',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {m.text}
                  {m.requiresLogin && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href="/student/login"
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#2E56DD',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          fontWeight: 700,
                        }}
                      >
                        🔑 Sign In as Student &rarr;
                      </a>
                    </div>
                  )}
                  {m.links && m.links.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {m.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          📄 {link.label} &rarr;
                        </a>
                      ))}
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                      <b>Source:</b> {m.sources[0].documentTitle}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', padding: '5px' }}>
                Searching official records...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div style={{ padding: '8px 12px', background: '#f1f5f9', display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {suggestedQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSend(q.query)}
                style={{
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: '#2E56DD',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ padding: '10px 12px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                background: '#2E56DD',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

