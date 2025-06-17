import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchCurrentUser(token: string) {
  try {
    const response = await apiClient.get('/user');
    const { data } = response.data; // Adjust according to your actual response
    
    if (!data?.user) {
      throw new Error('User data not found in response');
    }
    
    setUser(data.user);
    setToken(token);
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  } finally {
    setLoading(false);
  }
}

  async function login(email: string, password: string) {
  setLoading(true);
  try {
    const response = await apiClient.post('/users/signin', { 
      email, 
      password 
    });

    // Destructure according to your backend response
    const { data } = response.data; // Extract the data object
    const { user, token } = data; // Destructure user and token from data

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
    
    // Role-based navigation
    switch(user.role.toLowerCase()) {
      case 'marketing': 
        navigate('/marketing'); 
        break;
      case 'trade': 
        navigate('/trade'); 
        break;
      case 'treasury': 
        navigate('/treasury'); 
        break;
      case 'admin': 
        navigate('/admin'); 
        break;
      default: 
        navigate('/login');
        throw new Error(`Unknown role: ${user.role}`);
    }
  } catch (error) {
    console.error('Login error:', error);
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
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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