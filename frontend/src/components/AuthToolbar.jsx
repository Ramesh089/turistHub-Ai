import React, { useState, useRef, useEffect } from 'react';
import { Palette, Languages, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export default function AuthToolbar() {
  const { theme, toggleTheme, accentColor, setAccentColor, palettes } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const colorRef = useRef(null);
  const langRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setColorMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* 1. Theme Color Palette */}
      <div ref={colorRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setColorMenuOpen(!colorMenuOpen);
            setLangMenuOpen(false);
          }}
          title={t('changeColor')}
          aria-label={t('changeColor')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.75)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
        >
          <Palette size={20} />
        </button>

        {colorMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '42px',
              right: '0px',
              background: '#1e2029',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '160px',
              zIndex: 100
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>
              Select Theme Accent
            </div>
            {palettes.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setAccentColor(p.value);
                  setColorMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  background: accentColor === p.value ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: p.value,
                      display: 'inline-block'
                    }}
                  />
                  <span>{p.name}</span>
                </div>
                {accentColor === p.value && <Check size={14} color="#5B7CFF" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Language Switcher */}
      <div ref={langRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setLangMenuOpen(!langMenuOpen);
            setColorMenuOpen(false);
          }}
          title={t('switchLanguage')}
          aria-label={t('switchLanguage')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.75)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
        >
          <Languages size={20} />
        </button>

        {langMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '42px',
              right: '0px',
              background: '#1e2029',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '140px',
              zIndex: 100
            }}
          >
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setLangMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: language === l.code ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  textAlign: 'left'
                }}
              >
                <span>{l.native}</span>
                {language === l.code && <Check size={14} color="#5B7CFF" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Dark / Light Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        title={t('toggleTheme')}
        aria-label={t('toggleTheme')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.75)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s, color 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}

