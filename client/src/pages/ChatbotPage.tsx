import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/chatbot.css';
import { sendChatMessage, fetchSuggestedQuestions, SuggestedQuestion, SourceCitation } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: SourceCitation[];
  links?: { label: string; url: string }[];
  requiresLogin?: boolean;
  confidence?: number;
  status?: string;
}

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-greeting',
      sender: 'bot',
      text: "Hello.. I'm listening! Go on..",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);

  const messageSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggested questions on mount
  useEffect(() => {
    fetchSuggestedQuestions().then(setSuggestedQuestions);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom whenever messages update or loading state changes
  useEffect(() => {
    if (messageSectionRef.current) {
      messageSectionRef.current.scrollTop = messageSectionRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');

    // Append user message
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history format for contextual follow-ups
      const history = messages.slice(-4).map((m) => ({
        role: (m.sender === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await sendChatMessage(query, history);

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: res.answer,
        sources: res.sources,
        links: res.links,
        requiresLogin: res.requiresLogin,
        confidence: res.confidence,
        status: res.status,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: 'Sorry, I encountered a temporary connection issue. Please check your network and try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-back-nav">
          <Link to="/">
            &larr; Back to College Website
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            TRR Group of Institutions &bull; AI Information System
          </span>
        </div>

        <div className="card">
          <div id="common" style={{ border: '2px solid grey' }}>
            <div id="header">
              <h1>SMART-CONNECT!</h1>
              <div className="sub-header">
                Ask anything about TRR Engineering, Pharmacy &amp; Polytechnic
              </div>
            </div>

            <hr style={{ backgroundColor: 'transparent', margin: 0 }} />

            <div id="message-section" ref={messageSectionRef}>
              {messages.map((msg) => (
                <div key={msg.id} className="message" id={msg.sender}>
                  {msg.sender === 'user' ? (
                    <span id="user-response">{msg.text}</span>
                  ) : (
                    <div>
                      <span id="bot-response" className="bot-text">
                        {msg.text}
                      </span>

                      {msg.requiresLogin && (
                        <div style={{ marginTop: '12px' }}>
                          <Link
                            to="/student/login"
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#2E56DD',
                              color: 'white',
                              padding: '8px 18px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              textDecoration: 'none',
                              fontWeight: 700,
                            }}
                          >
                            🔑 Sign In to Student Portal &rarr;
                          </Link>
                        </div>
                      )}

                      {msg.links && msg.links.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {msg.links.map((link, idx) => (
                            <Link
                              key={idx}
                              to={link.url}
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                padding: '5px 12px',
                                borderRadius: '15px',
                                fontSize: '12px',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              📄 {link.label} &rarr;
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Traceable Source Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="source-pill-container">
                          <span className="source-title-label">Verified Sources:</span>
                          {msg.sources.map((src) => (
                            <span key={src.id} className="source-item" title={src.sourceReference || src.documentTitle}>
                              📄 {src.documentTitle} {src.section ? `(${src.section})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator while LLM / retrieval is executing */}
              {isLoading && (
                <div className="message" id="bot">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                      SmartConnect is searching verified institutional records...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Question Buttons */}
            <div id="button-container">
              {suggestedQuestions.map((q) => (
                <button
                  key={q.id}
                  className="chat-button"
                  onClick={() => handleSend(q.query)}
                  disabled={isLoading}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Text Input Section */}
            <div id="input-section">
              <input
                id="input"
                ref={inputRef}
                type="text"
                placeholder="Type a message (e.g., college timings, principal, admission documents)..."
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="send-btn"
                id="btn"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                title="Send message"
              >
                <div className="circle">
                  <svg viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
