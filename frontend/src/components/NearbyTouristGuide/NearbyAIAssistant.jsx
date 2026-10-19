import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Clock,
  MapPin,
  Compass,
  CheckCircle,
  Lightbulb,
  Navigation,
  Bot
} from 'lucide-react';

export default function NearbyAIAssistant({
  aiResponse,
  loadingAI,
  onAskQuery,
  onSelectPlaceByName,
  userLocation
}) {
  const [customQuery, setCustomQuery] = useState('');

  const quickPrompts = [
    { label: '🌟 Best places near me', query: 'Best places near me' },
    { label: '🚶 Places to visit within 5 km', query: 'Places to visit within 5 km' },
    { label: '🏛️ Historical places nearby', query: 'Historical places nearby' },
    { label: '👨‍👩‍👧 Places to visit with family', query: 'Places to visit with family' },
    { label: '⏱️ Plan a 2-hour sightseeing trip', query: 'Plan a 2-hour sightseeing trip' },
    { label: '💰 Find nearby places within my budget', query: 'Find nearby places within my budget' },
    { label: '🌅 What can I visit before sunset?', query: 'What can I visit before sunset?' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim() || loadingAI) return;
    onAskQuery(customQuery.trim());
    setCustomQuery('');
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      boxShadow: '0 10px 30px rgba(245, 158, 11, 0.08)',
      padding: '24px 28px',
      marginTop: '36px'
    }}>
      {/* AI Assistant Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--dark)' }}>
                AI Local Travel Concierge
              </h3>
              <span className="badge badge-gold" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                ✨ Smart Guide
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
              Intelligent recommendations tailored to your live location in {userLocation?.city || 'India'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Action Chips */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Quick Guidance Questions:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onAskQuery(p.query)}
              disabled={loadingAI}
              style={{
                background: '#faf6f0',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#78350f',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: loadingAI ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                opacity: loadingAI ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!loadingAI) {
                  e.currentTarget.style.background = '#fef3c7';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }
              }}
              onMouseOut={(e) => {
                if (!loadingAI) {
                  e.currentTarget.style.background = '#faf6f0';
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Query Input Bar */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1.5px solid #e2e8f0',
          padding: '4px 6px',
          transition: 'border-color 0.2s ease'
        }}>
          <input
            type="text"
            placeholder="Ask AI anything about places around you (e.g. Which temple is open right now?)..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            disabled={loadingAI}
            style={{
              flexGrow: 1,
              border: 'none',
              background: 'transparent',
              padding: '10px 14px',
              fontSize: '0.88rem',
              outline: 'none',
              color: 'var(--dark)'
            }}
          />
          <button
            type="submit"
            disabled={loadingAI || !customQuery.trim()}
            style={{
              background: loadingAI || !customQuery.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: loadingAI || !customQuery.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Ask</span>
            <Send size={13} />
          </button>
        </div>
      </form>

      {/* AI Output / Result Display */}
      {loadingAI ? (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          borderRadius: '14px',
          padding: '36px 20px',
          textAlign: 'center',
          border: '1px solid #fde68a'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
            marginBottom: '12px',
            animation: 'spin 2s linear infinite'
          }}>
            <Sparkles size={22} color="#d97706" />
          </div>
          <h4 style={{ fontSize: '1.05rem', color: '#92400e', marginBottom: '4px' }}>
            AI Travel Concierge is Analyzing...
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#b45309' }}>
            Matching your location, opening times, distances, and local tourist advice.
          </p>
        </div>
      ) : aiResponse ? (
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          {/* Response Title & Summary */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-serif)',
              color: '#0f172a',
              fontWeight: '700',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🧭</span>
              <span>{aiResponse.title}</span>
            </h4>
            <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
              {aiResponse.summary}
            </p>
          </div>

          {/* 2-Hour Route Timeline (if generated) */}
          {aiResponse.route_plan && aiResponse.route_plan.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px' }}>
                Suggested Timeline & Sequence:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiResponse.route_plan.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {step.time}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', marginBottom: '2px' }}>
                        {step.place}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                        {step.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Places Cards */}
          {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px' }}>
                Recommended Highlights:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px'
              }}>
                {aiResponse.recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-sky" style={{ fontSize: '0.72rem' }}>
                        {item.category || 'Sightseeing'}
                      </span>
                      {item.distance && (
                        <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
                          {item.distance}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    {item.timing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#059669', marginBottom: '6px' }}>
                        <Clock size={12} />
                        <span>{item.timing}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4, marginBottom: '10px' }}>
                      {item.highlight}
                    </div>
                    {onSelectPlaceByName && (
                      <button
                        onClick={() => onSelectPlaceByName(item.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <MapPin size={12} />
                        <span>Find on Map & Details &rarr;</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Local Insider Tips */}
          {aiResponse.insider_tips && aiResponse.insider_tips.length > 0 && (
            <div style={{
              background: '#fffbeb',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid #fde68a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                <Lightbulb size={15} color="#d97706" />
                <span>Verified Local Insider Tips:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#78350f', lineHeight: 1.6 }}>
                {aiResponse.insider_tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
