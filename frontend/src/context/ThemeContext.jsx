import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Resolved theme: always 'light' or 'dark', even when setting is 'system'
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return saved;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (currentTheme) => {
      let resolved = currentTheme;
      if (currentTheme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      }

      setActiveTheme(resolved);

      if (resolved === 'dark') {
        root.classList.add('dark-mode');
        body.classList.add('dark-mode');
      } else {
        root.classList.remove('dark-mode');
        body.classList.remove('dark-mode');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    const listener = (e) => {
      if (theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        setActiveTheme(resolved);
        if (e.matches) {
          root.classList.add('dark-mode');
          body.classList.add('dark-mode');
        } else {
          root.classList.remove('dark-mode');
          body.classList.remove('dark-mode');
        }
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
