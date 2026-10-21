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
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Camera,
  Coins,
  Share2
} from 'lucide-react';
import BookingModal from '../components/BookingModal';

// Enhanced Inline Markdown & Token Formatter
function InlineFormat({ text }) {
  if (!text) return null;

  // Tokenize code `...`, bold **...**, and italic *...*
  const tokens = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', val: text.substring(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', val: raw.slice(1, -1) });
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', val: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', val: raw.slice(1, -1) });
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', val: text.substring(lastIndex) });
  }

  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'bold') {
          return (
            <strong key={i} style={{ color: '#0f172a', fontWeight: '700' }}>
              {token.val}
            </strong>
          );
        }
        if (token.type === 'italic') {
          return (
            <em key={i} style={{ fontStyle: 'italic', color: '#475569' }}>
              {token.val}
            </em>
          );
        }
        if (token.type === 'code') {
          return (
            <code
              key={i}
              style={{
                background: '#f1f5f9',
                color: '#0369a1',
                padding: '2px 7px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.86em',
                border: '1px solid #e2e8f0',
                fontWeight: '600'
              }}
            >
              {token.val}
            </code>
          );
        }
        return <span key={i}>{token.val}</span>;
      })}
    </>
  );
}

// Rich Message Formatter with Headings, Tables, Numbered Badges & Bulleted Lists
function FormattedMessage({ text }) {
  if (!text) return null;

  const blocks = text.split('\n\n');

  return (
    <div className="formatted-ai-stream" style={{ lineHeight: 1.74, fontSize: '0.94rem', color: '#334155' }}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Render Markdown Tables
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const headerCells = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
            const bodyLines = lines.slice(2);

            return (
              <div key={bIdx} style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', background: '#ffffff' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>
                          <InlineFormat text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyLines.map((row, rIdx) => {
                      const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
                      return (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '9px 14px', color: '#334155' }}>
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

        // 2. Heading Level 3 (###) with stylish accent bar
        if (trimmed.startsWith('### ')) {
          return (
            <div key={bIdx} style={{ margin: '18px 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', borderRadius: '4px' }} />
              <h4 style={{ fontSize: '1.18rem', fontFamily: 'var(--font-serif)', color: '#0f172a', margin: 0, fontWeight: '700' }}>
                <InlineFormat text={trimmed.replace(/^###\s+/, '')} />
              </h4>
            </div>
          );
        }

        // 3. Heading Level 4 (####)
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={bIdx} style={{ fontSize: '1.02rem', color: '#0284c7', margin: '14px 0 6px 0', fontWeight: '700' }}>
              <InlineFormat text={trimmed.replace(/^####\s+/, '')} />
            </h5>
          );
        }

        // 4. Horizontal Line
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={bIdx} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />;
        }

        // 5. Stylized Blockquote / Tip (> text)
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={bIdx}
              style={{
                borderLeft: '4px solid #0284c7',
                background: '#f0f9ff',
                padding: '10px 14px',
                borderRadius: '0 10px 10px 0',
                margin: '10px 0',
                color: '#0369a1',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}
            >
              <InlineFormat text={trimmed.replace(/^>\s+/, '')} />
            </div>
          );
        }

        // 6. Numbered Lists (1., 2., 3.) with circular numbered badges
        const numberedRegex = /^\d+\.\s+/;
        if (trimmed.split('\n').some((l) => numberedRegex.test(l.trim()))) {
          const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
          return (
            <div key={bIdx} style={{ margin: '10px 0 12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(\d+)\.\s+(.*)/);
                if (match) {
                  return (
                    <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          border: '1px solid #bae6fd'
                        }}
                      >
                        {match[1]}
                      </span>
                      <div style={{ flex: 1, color: '#334155' }}>
                        <InlineFormat text={match[2]} />
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} style={{ margin: '4px 0', paddingLeft: '34px' }}>
                    <InlineFormat text={line} />
                  </p>
                );
              })}
            </div>
          );
        }

        // 7. Bullet Lists (•, *, -) with custom cyan dots
        if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
          return (
            <ul key={bIdx} style={{ margin: '8px 0 10px 0', paddingLeft: '8px', listStyleType: 'none' }}>
              {items.map((item, iIdx) => (
                <li key={iIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '7px', color: '#334155' }}>
                  <span style={{ color: '#0284c7', fontSize: '1.1rem', lineHeight: '1.2', flexShrink: 0 }}>•</span>
                  <span><InlineFormat text={item.replace(/^[•*-]\s+/, '')} /></span>
                </li>
              ))}
            </ul>
          );
        }

        // 8. Standard Paragraph
        return (
          <p key={bIdx} style={{ margin: '8px 0', lineHeight: 1.74 }}>
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

  // Quick City Presets
  const quickCityPresets = [
    { name: 'Yadgir', prompt: 'I want to visit Yadgir' },
    { name: 'Hampi', prompt: 'Tell me about Hampi' },
    { name: 'Mysore', prompt: 'Plan a 2-day trip to Mysore' },
    { name: 'Coorg', prompt: 'I want to visit Coorg' },
    { name: 'Jaipur', prompt: 'Tell me about Jaipur' },
    { name: 'Goa', prompt: 'What are the best places in Goa?' }
  ];

  // Dynamic suggested follow-up prompts
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

I am your intelligent India travel concierge and itinerary planner. You can ask me any travel questions naturally:

• **Destination Discovery:** *"I want to visit Yadgir"*, *"Tell me about Hampi"*  
• **Sightseeing & Attractions:** *"What are the best places to visit in Yadgir?"*  
• **Photography & Vibe:** *"Which place is best for photography?"*  
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

  // Reset chat history
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
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #065f46 100%)',
          color: '#ffffff'
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 'min(100%, 300px)' }}>
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
                fontSize: '0.8rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}
            >
              <Sparkles size={14} /> Intelligent Travel Assistant & Trip Planner
            </div>
            <h1 className="page-banner-title">
              Conversational Travel Concierge
            </h1>
            <p style={{ color: '#e0f2fe', maxWidth: '760px', fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
              Ask general questions about destinations, attractions, food, and transit, or request a customized day-by-day itinerary with an itemized budget breakdown.
            </p>
          </div>
          <img
            src="/logo.png"
            alt="Tourist AI Hub Logo"
            className="page-banner-logo"
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '6px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
            }}
          />
        </div>
      </div>

      <div className="container">
        {/* Main Grid: Chat Assistant (Left) & Trip Itinerary Canvas (Right) */}
        <div className="ai-planner-grid">
          {/* LEFT PANEL: Conversational Travel Assistant */}
          <div className="card" style={{ padding: 'clamp(16px, 3vw, 22px)', background: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.05)', border: '1px solid #e2e8f0' }}>
            {/* Chat Assistant Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Bot size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, fontFamily: 'var(--font-serif)' }}>
                      AI Travel Companion
                    </h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      Online • {aiProvider}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={12} color="#0284c7" />
                    <span>Topic: </span>
                    <strong style={{ color: travelContext.activeDestination ? '#0284c7' : '#94a3b8' }}>
                      {travelContext.activeDestination || 'No destination selected yet'}
                    </strong>
                  </div>
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
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
              >
                <RotateCcw size={12} /> Clear Chat
              </button>
            </div>

            {/* Quick City Presets Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', flexShrink: 0 }}>
                Quick:
              </span>
              {quickCityPresets.map((city, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleSendMessage(city.prompt)}
                  disabled={generating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: travelContext.activeDestination?.toLowerCase() === city.name.toLowerCase() ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    background: travelContext.activeDestination?.toLowerCase() === city.name.toLowerCase() ? '#e0f2fe' : '#f8fafc',
                    color: travelContext.activeDestination?.toLowerCase() === city.name.toLowerCase() ? '#0369a1' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (travelContext.activeDestination?.toLowerCase() !== city.name.toLowerCase()) {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (travelContext.activeDestination?.toLowerCase() !== city.name.toLowerCase()) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>

            {/* Scrollable Conversation Stream */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '520px',
                overflowY: 'auto',
                padding: '8px 4px',
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
                        gap: '10px',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        maxWidth: '92%'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f1f5f9',
                          color: isUser ? '#ffffff' : '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          boxShadow: isUser ? '0 4px 10px rgba(2, 132, 199, 0.3)' : '0 2px 6px rgba(0,0,0,0.05)',
                          border: isUser ? 'none' : '1px solid #e2e8f0'
                        }}
                      >
                        {isUser ? <User size={16} /> : <Bot size={16} />}
                      </div>

                      <div
                        style={{
                          background: isUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                          color: isUser ? '#ffffff' : '#1e293b',
                          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                          padding: isUser ? '12px 18px' : '16px 20px',
                          boxShadow: isUser ? '0 4px 16px rgba(2, 132, 199, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                          border: isUser ? 'none' : '1.5px solid #e2e8f0',
                          wordBreak: 'break-word',
                          lineHeight: 1.7
                        }}
                      >
                        {isUser ? (
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.94rem', fontWeight: '500' }}>
                            {message.text}
                          </div>
                        ) : (
                          <div>
                            <FormattedMessage text={message.text} />
                            {Array.isArray(message.options) && message.options.length > 0 && (
                              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                                      gap: '3px',
                                      padding: '8px 14px',
                                      background: '#f0f9ff',
                                      border: '1.5px solid #0284c7',
                                      borderRadius: '10px',
                                      color: '#0369a1',
                                      fontWeight: '600',
                                      fontSize: '0.85rem',
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
                                      <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: '400' }}>
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

                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', padding: '0 42px' }}>
                      {message.time}
                    </span>
                  </div>
                );
              })}

              {generating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start', background: '#f8fafc', padding: '12px 18px', borderRadius: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.2s both' }} />
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.4s both' }} />
                  </div>
                  <span style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>
                    AI Travel Companion is researching attractions and calculating routes...
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Dynamic Context-Aware Follow-Up Prompt Suggestions */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>
                💡 Suggested Follow-Ups:
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
                      padding: '6px 14px',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '10px', marginTop: '12px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  placeholder="Ask a question (e.g. 'Tell me about Yadgir', 'What food is famous in Mysore?', or 'Plan a 2-day trip within ₹6,000')..."
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '12px 52px 12px 16px',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || generating}
                  title="Send message (Enter)"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '16px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: inputMessage.trim() && !generating ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#e2e8f0',
                    color: inputMessage.trim() && !generating ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: inputMessage.trim() && !generating ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: inputMessage.trim() && !generating ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for new line
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Interactive Itinerary & Plan Canvas */}
          <div>
            {planResult ? (
              <div className="animate-fade-in" id="printable-itinerary">
                {/* Trip Header Summary Card */}
                <div className="card" style={{ padding: 'clamp(18px, 4vw, 26px)', marginBottom: '22px', borderLeft: '6px solid #0284c7', borderRadius: '20px', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-sky" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Verified AI Itinerary
                        </span>
                        {planResult.budget_status === 'SURPLUS' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: '700' }}>
                            <CheckCircle2 size={12} /> Within Budget
                          </span>
                        )}
                        {planResult.budget_status === 'DEFICIT' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: '700' }}>
                            <AlertCircle size={12} /> Cost Optimized
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.9rem', margin: '8px 0 6px', fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                        {planResult.destination} Custom Expedition
                      </h2>

                      <div style={{ fontSize: '0.88rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                        <span>📍 {planResult.origin} → {planResult.destination}</span>
                        <span>⏱️ {planResult.days} Days / {planResult.nights} Night(s)</span>
                        <span>👥 {planResult.people} Traveler(s) ({planResult.traveller_type})</span>
                        <span>🚆 {planResult.transport}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
                        Estimated Total Cost
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '2rem', fontWeight: '800', color: '#0284c7' }}>
                        <IndianRupee size={22} />
                        {Number(planResult.estimated_cost).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                        ~₹{Number(planResult.per_person_cost).toLocaleString('en-IN')} per person
                      </div>
                    </div>
                  </div>

                  {/* Budget Status Callout (if notice exists) */}
                  {planResult.budget_explanation && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: planResult.budget_status === 'DEFICIT' ? '#fffbeb' : '#f0fdf4',
                        border: planResult.budget_status === 'DEFICIT' ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        fontSize: '0.88rem',
                        color: planResult.budget_status === 'DEFICIT' ? '#92400e' : '#166534',
                        marginBottom: '18px',
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
                      gap: '12px',
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '18px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Transit & Travel</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '2px' }}>
                        ₹{planResult.cost_breakdown?.transportation?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Lodging ({planResult.nights}N)</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '2px' }}>
                        ₹{planResult.cost_breakdown?.accommodation?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Meals & Dining</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '2px' }}>
                        ₹{planResult.cost_breakdown?.food_dining?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Local Transit</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '2px' }}>
                        ₹{planResult.cost_breakdown?.local_transit?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Monuments & Entry</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '2px' }}>
                        ₹{planResult.cost_breakdown?.sightseeing_activities?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Save & Print */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {savedSuccess ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          fontWeight: '700',
                          fontSize: '0.85rem'
                        }}
                      >
                        <BookmarkCheck size={16} color="#10b981" /> Saved to My Trips
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={handleSavePlan} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        <BookmarkCheck size={16} color="#0284c7" /> Save to My Trips
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                      <Printer size={16} color="#0284c7" /> Print Itinerary
                    </button>
                  </div>

                  {/* Guaranteed Package Booking Banner with Instant Discount */}
                  <div
                    style={{
                      marginTop: '18px',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                      border: '1.5px dashed #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem', fontWeight: '800', color: '#065f46' }}>
                        <Gift size={18} color="#10b981" /> Turn into an All-Inclusive Holiday Package
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: '2px' }}>
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
                      style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}
                    >
                      <CreditCard size={15} /> Book with Discounts &rarr;
                    </button>
                  </div>
                </div>

                {/* Day-by-Day Detailed Schedule with Timeline Icons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {planResult.itinerary?.map((dayItem) => (
                    <div key={dayItem.day} className="card" style={{ padding: 'clamp(18px, 3.5vw, 24px)', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontSize: '0.82rem',
                              fontWeight: '800',
                              letterSpacing: '0.5px'
                            }}
                          >
                            DAY {dayItem.day}
                          </span>
                          <h3 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                            {dayItem.title}
                          </h3>
                        </div>
                        <span className="badge badge-sky" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                          Day Budget: ₹{dayItem.estimated_cost?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Timeline Slots: Morning, Afternoon, Evening */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Morning */}
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#fef3c7', color: '#b45309', fontWeight: '700', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                            <Sunrise size={15} /> Morning
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.68, fontSize: '0.92rem' }}>
                            {dayItem.morning}
                          </p>
                        </div>

                        {/* Afternoon */}
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#ecfdf5', color: '#047857', fontWeight: '700', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                            <Sun size={15} /> Afternoon
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.68, fontSize: '0.92rem' }}>
                            {dayItem.afternoon}
                          </p>
                        </div>

                        {/* Evening */}
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#f0f9ff', color: '#0284c7', fontWeight: '700', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                            <Sunset size={15} /> Evening
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.68, fontSize: '0.92rem' }}>
                            {dayItem.evening}
                          </p>
                        </div>
                      </div>

                      {/* Day Highlights Footer */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f8fafc', fontSize: '0.82rem', color: '#64748b' }}>
                        {dayItem.food_recommendations?.specialty && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '600' }}>
                            <Utensils size={14} color="#0284c7" /> Food: {dayItem.food_recommendations?.specialty}
                          </span>
                        )}
                        {dayItem.suggested_transport && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bus size={14} color="#10b981" /> {dayItem.suggested_transport}
                          </span>
                        )}
                        {dayItem.travel_time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} /> {dayItem.travel_time}
                          </span>
                        )}
                        {dayItem.attractions?.[0] && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="#ef4444" /> {dayItem.attractions[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Informational & Planning Canvas when No Plan has been generated yet */
              <div className="card" style={{ padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 36px)', borderRadius: '22px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.05)' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    marginBottom: '18px',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)'
                  }}
                >
                  <Compass size={36} />
                </div>

                <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  Interactive Travel Canvas
                </h3>

                <p style={{ margin: '0 auto 28px auto', color: '#64748b', maxWidth: '580px', fontSize: '0.94rem', lineHeight: 1.68 }}>
                  {travelContext.activeDestination ? (
                    <>You are currently exploring <strong>{travelContext.activeDestination}</strong>. Ask any question in chat or tap a trip planning shortcut below to generate an itinerary and itemized budget.</>
                  ) : (
                    <>Ask questions about any Indian tourist destination, explore cultural heritage, or tap a shortcut below to start planning.</>
                  )}
                </p>

                {/* Quick Planning Shortcut Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', textAlign: 'left', marginBottom: '28px' }}>
                  <div
                    onClick={() => handleSendMessage(`Plan a 2-day weekend trip to ${travelContext.activeDestination || 'Yadgir'} within ₹6,000`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(2, 132, 199, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>⚡ 2-Day Weekend Plan</div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                      Fast-paced weekend getaway covering major iconic landmarks, forts, and signature dining.
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage(`Plan a 3-day trip to ${travelContext.activeDestination || 'Hampi'} with heritage and food`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(2, 132, 199, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>🏛️ 3-Day Heritage Trail</div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                      Deep dive into palaces, ancient temples, walking bazaars, and musical fountains.
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage(`How much will a 2-day trip to ${travelContext.activeDestination || 'Yadgir'} cost?`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(2, 132, 199, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>💰 Estimate Travel Budget</div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                      Understand typical expenses for transit, verified stays, entry tickets, and dining.
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage(`What are the best photography viewpoints and hidden spots in ${travelContext.activeDestination || 'Coorg'}?`)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(2, 132, 199, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>📸 Photography & Hidden Gems</div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                      Capture sunrise hills, architectural carvings, serene lakes, and scenic trails.
                    </div>
                  </div>
                </div>

                {/* Feature Highlights Banner */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '20px', fontSize: '0.84rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="#10b981" /> Day-by-Day Scheduling</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="#10b981" /> Itemized Budget Verification</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="#10b981" /> Authentic Local Food Spots</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="#10b981" /> Instant Booking Checkout</span>
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
                role: 'assistant',
                text: `### 🎉 Booking Confirmed & Payment Successful!

Your trip booking for **${planResult?.destination || bookingModalPkg?.title || 'your destination'}** has been confirmed!

• **Booking Reference:** \`${data?.booking_reference || (data?.booking_id ? `TH-BK-${data.booking_id}` : 'TH-BK-CONFIRMED')}\`
• **Demo Transaction ID:** \`${data?.transaction?.demo_transaction_id || 'DEMO_TXN_SUCCESS'}\`
• **Amount Paid:** ₹${Number(data?.transaction?.amount || data?.total_amount || 0).toLocaleString('en-IN')}

You can view and download your official payment receipt anytime in your **Dashboard**! Have an incredible journey! ✈️🏖️`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }}
        />
      )}
    </div>
  );
}
