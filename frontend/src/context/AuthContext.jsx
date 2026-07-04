import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user details using token
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user_role', btoa(data.data.role));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        // Load full user details
        await loadUser();
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Signup handler
  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        await loadUser();
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setUser(null);
  };

  // Update profile
  const updateProfile = async (id, updatedFields) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        // If updating self, reload profile
        if (user && user._id === id) {
          setUser(data.data);
        }
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message || 'Failed to update profile' };
      }
    } catch (err) {
      return { success: false, message: 'Server error occurred' };
    }
  };

  // Submit daily mood log
  const logMood = async (mood, note) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/auth/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mood, note })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh profile to update local user state with the new mood logs
        await loadUser();
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Failed to log mood' };
      }
    } catch (err) {
      return { success: false, message: 'Server error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, logMood }}>
      {children}
    </AuthContext.Provider>
  );
};
