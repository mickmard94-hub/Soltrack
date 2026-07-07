import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('soltrack_token');
    if (!token) {
      setChargement(false);
      return;
    }

    api.get('/user')
      .then((response) => {
        setUser(response.data);
        setChargement(false);
      })
      .catch(() => {
        localStorage.removeItem('soltrack_token');
        setChargement(false);
      });
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('soltrack_token', token);
    setUser(userData);
  };

  const logout = () => {
    api.post('/logout').finally(() => {
      localStorage.removeItem('soltrack_token');
      setUser(null);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, chargement }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}