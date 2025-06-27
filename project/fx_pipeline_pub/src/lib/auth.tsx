import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed property for authentication status
  const isAuthenticated = !!(user && token);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    setLoading(true);
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      await fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }

  async function fetchCurrentUser(token: string) {
    try {
      const response = await apiClient.get('/user');
      const { data } = response.data;
      
      if (!data?.user) {
        throw new Error('User data not found in response');
      }
      
      setUser(data.user);
      setToken(token);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; user?: User }> {
    setLoading(true);
    try {
      const response = await apiClient.post('/users/signin', { 
        email, 
        password 
      });

      const { data } = response.data;
      const { user, token } = data;

      if (!user || !token) {
        throw new Error('Invalid response structure from server');
      }

      if (!user.role) {
        throw new Error('User role not found in response');
      }

      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      
      return { success: true, user };
      
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state on error
      localStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    setLoading(true);
    try {
      await apiClient.post('/users', userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated,
      login, 
      register, 
      logout, 
      loading,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}