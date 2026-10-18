import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ACCENT_PALETTES = [
  { name: 'Periwinkle Blue', value: '#5B7CFF' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Sunset Amber', value: '#F97316' },
  { name: 'Royal Violet', value: '#8B5CF6' },
  { name: 'Cyan Sea', value: '#06B6D4' }
];

export function ThemeProvider({ children }) {
  // Dark theme by default as specified in requirements
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('touristhub_theme') || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('touristhub_accent') || '#5B7CFF';
  });

  useEffect(() => {
    localStorage.setItem('touristhub_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('touristhub_accent', accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-hover', adjustBrightness(accentColor, -15));
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        accentColor,
        setAccentColor,
        palettes: ACCENT_PALETTES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

