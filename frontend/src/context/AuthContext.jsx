import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(() => {
    return localStorage.getItem('isAnonymous') === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optimistic load
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));

      // Fetch latest
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setIsAnonymous(false);
    localStorage.removeItem('isAnonymous');
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setIsAnonymous(false);
    localStorage.removeItem('isAnonymous');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const browseAnonymously = () => {
    setIsAnonymous(true);
    localStorage.setItem('isAnonymous', 'true');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAnonymous, browseAnonymously }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
