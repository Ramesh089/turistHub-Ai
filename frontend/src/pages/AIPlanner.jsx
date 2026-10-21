import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  Compass,
  IndianRupee,
  Utensils,
  Bus,
  BookmarkCheck,
  Printer,
  Clock,
  MapPin,
  CreditCard,
  Gift,
  RotateCcw,
  Bot,
  User,
  Info,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import BookingModal from '../components/BookingModal';

// Clean Lightweight Formatted Markdown Renderer
function InlineFormat({ text }) {
  if (!text) return null;
  // Parse bold **text** and bullet indicators
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} style={{ color: '#0f172a', fontWeight: '700' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

function FormattedMessage({ text }) {
  if (!text) return null;

  const blocks = text.split('\n\n');

  return (
    <div style={{ lineHeight: 1.68, fontSize: '0.93rem', color: '#1e293b' }}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Render Markdown Tables
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const headerCells = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
            const bodyLines = lines.slice(2); // Skip delimiter line (|:---|:---:)

            return (
              <div key={bIdx} style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', background: '#ffffff' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>
                          <InlineFormat text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyLines.map((row, rIdx) => {
                      const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
                      return (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', background: rIdx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 12px', color: '#334155' }}>
                              <InlineFormat text={cell} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Heading Level 3 (###)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} style={{ fontSize: '1.18rem', fontFamily: 'var(--font-serif)', color: '#0f172a', margin: '16px 0 8px 0', fontWeight: '700' }}>
              <InlineFormat text={trimmed.replace(/^###\s+/, '')} />
            </h4>
          );
        }

        // Heading Level 4 (####)
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={bIdx} style={{ fontSize: '1rem', color: '#0369a1', margin: '14px 0 6px 0', fontWeight: '700' }}>
              <InlineFormat text={trimmed.replace(/^####\s+/, '')} />
            </h5>
          );
        }

        // Horizontal Line (---)
        if (trimmed === '---') {
          return <hr key={bIdx} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />;
        }

        // Bullet Lists (•, *, -)
        if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
          return (
            <ul key={bIdx} style={{ margin: '8px 0 10px 0', paddingLeft: '22px' }}>
              {items.map((item, iIdx) => (
                <li key={iIdx} style={{ marginBottom: '6px', color: '#334155' }}>
                  <InlineFormat text={item.replace(/^[•*-]\s+/, '')} />
                </li>
              ))}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={bIdx} style={{ margin: '8px 0', lineHeight: 1.68 }}>
            <InlineFormat text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

export default function AIPlanner() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const initialDestination = searchParams.get('dest') || '';
  const initialOrigin = searchParams.get('origin') || 'Bengaluru';
  const initialDays = parseInt(searchParams.get('days')) || 2;
  const initialBudget = searchParams.get('budget') ? parseInt(searchParams.get('budget')) : null;

  const [inputMessage, setInputMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [bookingModalPkg, setBookingModalPkg] = useState(null);
  const [aiProvider, setAiProvider] = useState('Smart Travel Engine');

  // Query backend for active AI provider info on mount
  useEffect(() => {
    api.get('/ai/status')
      .then((res) => {
        if (res.data?.active_provider) {
          setAiProvider(res.data.active_provider);
        }
      })
      .catch(() => {});
  }, []);

  // Multi-turn context memory
  const [travelContext, setTravelContext] = useState({
    activeDestination: initialDestination,
    origin: initialOrigin,
    days: initialDays,
    budget: initialBudget,
    people: 2,
    travellerType: 'Couple',
    currentPlan: null
  });

  // Dynamic suggested prompts
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    'I want to visit Yadgir',
    'What are the best places to visit in Yadgir?',
    'Tell me about Hampi',
    'Plan a 2-day trip to Coorg within ₹6,000',
    'What food is Mysore famous for?'
  ]);

  // Conversational message history
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: `### 🌟 Welcome to Tourist Hub AI!

I am your intelligent India travel companion and itinerary planner. You can ask me any travel questions naturally:

• **Destination Discovery:** *"I want to visit Yadgir"*, *"Tell me about Hampi"*  
• **Sightseeing & Attractions:** *"What are the best places to visit in Yadgir?"*  
• **Photography Spots:** *"Which place is best for photography?"*  
• **Food & Dining:** *"What food is famous in North Karnataka?"*  
• **Transportation:** *"How can I reach Yadgir from Bengaluru?"*  
• **Customized Itineraries:** *"Plan a 2-day trip to Mysore within ₹6,000"*  

Where would you like to travel today?`,
      options: [
        { label: 'Explore Yadgir', value: 'I want to visit Yadgir' },
        { label: 'Discover Hampi', value: 'Tell me about Hampi' },
        { label: 'Explore Coorg', value: 'I want to visit Coorg' },
        { label: 'Visit Mysore', value: 'Tell me about Mysore' }
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Auto-scroll chat window when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, generating]);

  // Submit chat message to AI assistant
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText.trim() : inputMessage.trim();
    if (!textToSend || generating) return;

    const userMsg = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setGenerating(true);
    setErrorMsg(null);

    try {
      // Build conversation history for context
      const formattedHistory = chatMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.text
      }));

      const res = await api.post('/ai/chat', {
        message: textToSend,
        conversation_history: formattedHistory,
        context: {
          ...travelContext,
          currentPlan: planResult || travelContext.currentPlan
        }
      });

      if (res.data.success) {
        const assistantMsg = {
          role: 'assistant',
          text: res.data.response_text,
          options: Array.isArray(res.data.options) ? res.data.options : [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages((prev) => [...prev, assistantMsg]);

        // If an itinerary was generated or modified, update right-hand plan canvas
        if (res.data.is_destination_change || (res.data.destination && travelContext.activeDestination && res.data.destination.toLowerCase() !== travelContext.activeDestination.toLowerCase())) {
          setPlanResult(null);
        } else if (res.data.plan) {
          setPlanResult(res.data.plan);
          setSavedSuccess(false);
        }

        // Update dynamic suggested follow-up prompts
        if (Array.isArray(res.data.suggested_prompts) && res.data.suggested_prompts.length > 0) {
          setSuggestedPrompts(res.data.suggested_prompts);
        }

        // Update active travel context
        if (res.data.context_updates) {
          const isDestChange = res.data.is_destination_change || (res.data.destination && travelContext.activeDestination && res.data.destination.toLowerCase() !== travelContext.activeDestination.toLowerCase());
          setTravelContext((prev) => ({
            ...prev,
            ...res.data.context_updates,
            activeDestination: res.data.destination || res.data.context_updates.activeDestination || prev.activeDestination,
            currentPlan: isDestChange ? null : (res.data.plan || prev.currentPlan)
          }));
        }
      } else {
        setErrorMsg(res.data.message || 'Unable to generate response. Please try again.');
      }
    } catch (err) {
      console.error('Chat AI Error:', err);
      setErrorMsg(err.response?.data?.message || 'Connection error. Please try asking again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Enter key submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset chat history and start fresh
  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        text: `### 🔄 Chat Reset

I'm ready for a fresh travel conversation! Ask me anything about Indian tourist destinations, local food, heritage, or pick a place to explore:`,
        options: [
          { label: 'Explore Yadgir', value: 'I want to visit Yadgir' },
          { label: 'Discover Hampi', value: 'Tell me about Hampi' },
          { label: 'Explore Coorg', value: 'I want to visit Coorg' },
          { label: 'Visit Mysore', value: 'Tell me about Mysore' }
        ],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSuggestedPrompts([
      'I want to visit Yadgir',
      'What are the best places to visit in Yadgir?',
      'Tell me about Hampi',
      'Plan a 2-day trip to Coorg within ₹6,000'
    ]);
    setPlanResult(null);
    setTravelContext((prev) => ({
      ...prev,
      activeDestination: '',
      currentPlan: null
    }));
    setErrorMsg(null);
  };

  // Save Plan to User Profile
  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!planResult) return;

    try {
      const res = await api.post('/ai/save-plan', { plan: planResult });
      if (res.data.success) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('Save Plan Error:', err);
      setErrorMsg('Failed to save plan to your account.');
    }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #065f46 100%)',
          color: '#ffffff',
          padding: '44px 0',
          marginBottom: '32px'
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(110, 231, 183, 0.4)',
                color: '#6ee7b7',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}
            >
              <Sparkles size={14} /> Intelligent Travel Assistant & Trip Planner
            </div>
            <h1 style={{ fontSize: '2.3rem', fontFamily: 'var(--font-serif)', margin: '0 0 10px 0' }}>
              Conversational Travel Concierge
            </h1>
            <p style={{ color: '#e0f2fe', maxWidth: '760px', fontSize: '0.98rem', margin: 0, lineHeight: 1.6 }}>
              Ask general questions about destinations, attractions, food, and transit, or request a customized day-by-day itinerary with an itemized budget breakdown.
            </p>
          </div>
          <img
            src="/logo.png"
            alt="Tourist AI Hub Logo"
            style={{
              height: '84px',
              width: '84px',
              borderRadius: '16px',
              objectFit: 'contain',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '6px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      <div className="container">
        {/* Main Grid: Chat Assistant (Left) & Trip Itinerary Canvas (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 490px) minmax(0, 1fr)', gap: '28px', alignItems: 'start' }}>
          {/* LEFT PANEL: Conversational Travel Assistant */}
          <div className="card" style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            {/* Chat Assistant Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      AI Travel Companion
                    </h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        padding: '1px 7px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      ✨ {aiProvider}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Active Topic: <strong style={{ color: '#0284c7' }}>{travelContext.activeDestination || 'Select Destination'}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} /> Clear Chat
              </button>
            </div>

            {/* Scrollable Conversation Stream */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                height: '460px',
                overflowY: 'auto',
                padding: '6px 4px',
                scrollBehavior: 'smooth'
              }}
            >
              {chatMessages.map((message, idx) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '100%'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        maxWidth: '92%'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isUser ? '#0284c7' : '#f1f5f9',
                          color: isUser ? '#ffffff' : '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          fontSize: '0.75rem'
                        }}
                      >
                        {isUser ? <User size={15} /> : <Bot size={15} />}
                      </div>

                      <div
                        style={{
                          background: isUser ? '#0284c7' : '#ffffff',
                          color: isUser ? '#ffffff' : '#1e293b',
                          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          padding: '12px 16px',
                          boxShadow: isUser ? '0 4px 12px rgba(2, 132, 199, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                          border: isUser ? 'none' : '1px solid #e2e8f0',
                          wordBreak: 'break-word'
                        }}
                      >
                        {isUser ? (
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.92rem' }}>
                            {message.text}
                          </div>
                        ) : (
                          <div>
                            <FormattedMessage text={message.text} />
                            {Array.isArray(message.options) && message.options.length > 0 && (
                              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {message.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSendMessage(opt.value || opt.label)}
                                    disabled={generating}
                                    style={{
                                      display: 'flex',
                                      flexDirection: opt.subtext ? 'column' : 'row',
                                      alignItems: opt.subtext ? 'flex-start' : 'center',
                                      gap: '2px',
                                      padding: '8px 14px',
                                      background: '#f0f9ff',
                                      border: '1.5px solid #0284c7',
                                      borderRadius: '10px',
                                      color: '#0369a1',
                                      fontWeight: '600',
                                      fontSize: '0.84rem',
                                      cursor: generating ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.15s ease',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#0284c7';
                                      e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#f0f9ff';
                                      e.currentTarget.style.color = '#0369a1';
                                    }}
                                  >
                                    <span>{opt.label}</span>
                                    {opt.subtext && (
                                      <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: '400' }}>
                                        {opt.subtext}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', padding: '0 36px' }}>
                      {message.time}
                    </span>
                  </div>
                );
              })}

              {generating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start', background: '#f8fafc', padding: '10px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.2s both' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.4s both' }} />
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '500' }}>
                    AI Concierge is analyzing your request...
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Dynamic Context-Aware Follow-Up Prompt Suggestions */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>
                💡 Suggested Questions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                {suggestedPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item)}
                    disabled={generating}
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      color: '#0369a1',
                      borderRadius: '30px',
                      padding: '5px 12px',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: '600',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#e0f2fe')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '10px', marginTop: '12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ marginTop: '14px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  disabled={generating}
                  placeholder="Ask a question (e.g. 'Tell me about Mysore', 'What food is famous?', or 'Plan a 2-day trip within ₹6,000')..."
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '12px 48px 12px 14px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || generating}
                  title="Send message (Enter)"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    bottom: '16px',
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: inputMessage.trim() && !generating ? '#0284c7' : '#e2e8f0',
                    color: inputMessage.trim() && !generating ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: inputMessage.trim() && !generating ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for new line
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Interactive Itinerary & Plan Canvas */}
          <div>
            {planResult ? (
              <div className="animate-fade-in" id="printable-itinerary">
                {/* Trip Header Summary Card */}
                <div className="card" style={{ padding: '24px', marginBottom: '22px', borderLeft: '6px solid #0284c7', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-sky" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Verified AI Itinerary
                        </span>
                        {planResult.budget_status === 'SURPLUS' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>
                            <CheckCircle2 size={12} /> Within Budget
                          </span>
                        )}
                        {planResult.budget_status === 'DEFICIT' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>
                            <AlertCircle size={12} /> Cost Optimized
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.85rem', margin: '8px 0 6px', fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                        {planResult.destination} Custom Tour
                      </h2>

                      <div style={{ fontSize: '0.88rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                        <span>📍 {planResult.origin} → {planResult.destination}</span>
                        <span>⏱️ {planResult.days} Days / {planResult.nights} Night(s)</span>
                        <span>👥 {planResult.people} Traveler(s) ({planResult.traveller_type})</span>
                        <span>🚆 {planResult.transport}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
                        Estimated Total Cost
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '1.9rem', fontWeight: '800', color: '#0284c7' }}>
                        <IndianRupee size={22} />
                        {Number(planResult.estimated_cost).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ~₹{Number(planResult.per_person_cost).toLocaleString('en-IN')} per person
                      </div>
                    </div>
                  </div>

                  {/* Budget Status Callout (if notice exists) */}
                  {planResult.budget_explanation && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: planResult.budget_status === 'DEFICIT' ? '#fffbeb' : '#f0fdf4',
                        border: planResult.budget_status === 'DEFICIT' ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        fontSize: '0.86rem',
                        color: planResult.budget_status === 'DEFICIT' ? '#92400e' : '#166534',
                        marginBottom: '16px',
                        lineHeight: 1.6
                      }}
                    >
                      <InlineFormat text={planResult.budget_explanation} />
                    </div>
                  )}

                  {/* Itemized Cost Breakdown Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>To & Fro Travel</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{planResult.cost_breakdown?.transportation?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Lodging ({planResult.nights}N)</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{planResult.cost_breakdown?.accommodation?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Meals & Dining</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{planResult.cost_breakdown?.food_dining?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Local Transit</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{planResult.cost_breakdown?.local_transit?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Monuments & Entry</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{planResult.cost_breakdown?.sightseeing_activities?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Save & Print */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {savedSuccess ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          fontWeight: '700',
                          fontSize: '0.82rem'
                        }}
                      >
                        <BookmarkCheck size={16} color="#10b981" /> Saved to My Trips
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={handleSavePlan} style={{ fontSize: '0.82rem' }}>
                        <BookmarkCheck size={16} color="#0284c7" /> Save to My Trips
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ fontSize: '0.82rem' }}>
                      <Printer size={16} color="#0284c7" /> Print Itinerary
                    </button>
                  </div>

                  {/* Guaranteed Package Booking Banner with Instant Discount */}
                  <div
                    style={{
                      marginTop: '18px',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: '#ecfdf5',
                      border: '1.5px dashed #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: '#065f46' }}>
                        <Gift size={16} color="#10b981" /> Turn into an All-Inclusive Holiday Package
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                        Hotel + Private Transport + Meals + Guide • <strong>Special ₹1,500 Discount (AIPLAN1500)</strong> pre-applied!
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingModalPkg({
                          id: 1,
                          title: `${planResult.destination} All-Inclusive Holiday Package`,
                          destination_name: planResult.destination,
                          company_name: 'Incredible South Journeys',
                          duration_days: planResult.days,
                          duration_nights: planResult.nights,
                          price: planResult.per_person_cost,
                          hotel_type: 'Heritage Deluxe Hotel',
                          transport_type: planResult.transport || 'AC Private Sedan',
                          food_included: true,
                          guide_included: true
                        });
                      }}
                      className="btn btn-green btn-sm"
                      style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CreditCard size={15} /> Book with Discounts &rarr;
                    </button>
                  </div>
                </div>

                {/* Day-by-Day Detailed Schedule */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {planResult.itinerary?.map((dayItem) => (
                    <div key={dayItem.day} className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.15rem', margin: 0, fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                          {dayItem.title}
                        </h3>
                        <span className="badge badge-sky" style={{ fontSize: '0.75rem' }}>
                          Est. Day Cost: ₹{dayItem.estimated_cost?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: '700', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', fontSize: '0.8rem' }}>
                            Morning
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '0.88rem' }}>
                            {dayItem.morning}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#ecfdf5', color: '#047857', fontWeight: '700', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', fontSize: '0.8rem' }}>
                            Afternoon
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '0.88rem' }}>
                            {dayItem.afternoon}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#f0f9ff', color: '#0284c7', fontWeight: '700', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', fontSize: '0.8rem' }}>
                            Evening
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '0.88rem' }}>
                            {dayItem.evening}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Utensils size={13} color="#0284c7" /> {dayItem.food_recommendations?.specialty}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Bus size={13} color="#10b981" /> {dayItem.suggested_transport}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} /> {dayItem.travel_time}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={13} /> {dayItem.attractions?.[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Informational & Planning Canvas when No Plan has been generated yet */
              <div className="card" style={{ padding: '36px 28px', borderRadius: '18px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    marginBottom: '16px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)'
                  }}
                >
                  <Compass size={32} />
                </div>

                <h3 style={{ fontSize: '1.45rem', marginBottom: '8px', color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  Interactive Travel Canvas
                </h3>

                <p style={{ margin: '0 auto 24px auto', color: '#64748b', maxWidth: '560px', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {travelContext.activeDestination ? (
                    <>You are exploring <strong>{travelContext.activeDestination}</strong>. Ask questions in chat or pick a trip planning shortcut below to generate an itinerary and itemized budget.</>
                  ) : (
                    <>Ask questions about any Indian tourist destination, or click a shortcut below to start planning.</>
                  )}
                </p>

                {/* Quick Planning Shortcut Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', textAlign: 'left', marginBottom: '24px' }}>
                  <div
                    onClick={() => handleSendMessage(`Plan a 2-day weekend trip to ${travelContext.activeDestination || 'Yadgir'} within ₹6,000`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>⚡ 2-Day Weekend Plan</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Fast-paced weekend getaway covering major iconic landmarks and signature dining.
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage(`Plan a 3-day trip to ${travelContext.activeDestination || 'Hampi'} with heritage and food`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>🏛️ 3-Day Heritage & Culture</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Deep dive into palaces, ancient temples, walking bazaars, and musical fountains.
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage(`How much will a 2-day trip to ${travelContext.activeDestination || 'Yadgir'} cost?`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>💰 Estimate Travel Budget</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Understand typical expenses for transport, stays, tickets, and dining.
                    </div>
                  </div>
                </div>

                {/* Feature Highlights Banner */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '18px', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>✓ Day-by-Day Scheduling</span>
                  <span>✓ Itemized Budget Verification</span>
                  <span>✓ Authentic Local Food Spots</span>
                  <span>✓ Accurate Transit & Opening Hours</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalPkg && (
        <BookingModal
          bookingType="package"
          item={bookingModalPkg}
          initialPlan={planResult}
          onClose={() => setBookingModalPkg(null)}
          onComplete={(data) => {
            setSavedSuccess(true);
            setBookingModalPkg(null);
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: 'ai',
                text: `🎉 **Payment Successful!**\n\nYour trip booking for **${planResult?.destination_name || bookingModalPkg?.title || 'your destination'}** has been confirmed!\n\n• **Booking Reference:** \`${data?.booking_reference || (data?.booking_id ? `TH-BK-${data.booking_id}` : 'TH-BK-CONFIRMED')}\`\n• **Transaction ID:** \`${data?.transaction?.demo_transaction_id || 'DEMO_TXN_SUCCESS'}\`\n• **Amount Paid:** ₹${Number(data?.transaction?.amount || data?.total_amount || 0).toLocaleString('en-IN')}\n\nYou can view your official receipt and trip details anytime in your **Dashboard**! Have an incredible journey! ✈️🏖️`
              }
            ]);
          }}
        />
      )}
    </div>
  );
}
