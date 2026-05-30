import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName) => {
    const root = document.documentElement;
    
    if (themeName === 'light') {
      // Light theme (Sunset)
      root.style.setProperty('--bg-primary', '#FFF5F0');
      root.style.setProperty('--bg-secondary', '#FFE8DC');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--text-muted', '#999999');
      root.style.setProperty('--neon-cyan', '#FF6B35');
      root.style.setProperty('--neon-gradient', 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)');
      root.style.setProperty('--card-border', 'rgba(255, 107, 53, 0.2)');
    } else {
      // Dark theme (Starry Space)
      root.style.setProperty('--bg-primary', '#0a0e27');
      root.style.setProperty('--bg-secondary', '#1a1f3a');
      root.style.setProperty('--bg-card', '#151b2f');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b8d4');
      root.style.setProperty('--text-muted', '#7a8299');
      root.style.setProperty('--neon-cyan', '#00d9ff');
      root.style.setProperty('--neon-gradient', 'linear-gradient(135deg, #00d9ff 0%, #0099cc 100%)');
      root.style.setProperty('--card-border', 'rgba(0, 217, 255, 0.1)');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
