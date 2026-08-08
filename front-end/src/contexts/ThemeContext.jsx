import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function themeInitial() {
  if (typeof document !== 'undefined') {
    const surAttribut = document.documentElement.getAttribute('data-theme');
    if (surAttribut) return surAttribut;
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themeInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('soltrack_theme', theme);
    } catch (e) {
      // Stockage indisponible (navigation privée, etc.) : le thème reste
      // actif pour la session en cours, simplement non mémorisé.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((actuel) => (actuel === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}