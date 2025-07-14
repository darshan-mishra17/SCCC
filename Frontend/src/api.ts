import axios from 'axios';

// Configure axios base URL
const API_BASE_URL = 'http://localhost:4000';
axios.defaults.baseURL = API_BASE_URL;

// Auth token management
let authToken: string | null = localStorage.getItem('authToken');

// Add token to requests
axios.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authToken = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    password: string;
  }) {
    const response = await axios.post('/api/auth/signup', userData);
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials: { email: string; password: string }) {
    const response = await axios.post('/api/auth/login', credentials);
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    const response = await axios.post('/api/auth/logout');
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response.data;
  },

  async getProfile() {
    const response = await axios.get('/api/auth/profile');
    return response.data;
  },

  async updateProfile(userData: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) {
    const response = await axios.put('/api/auth/profile', userData);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
};

// 1. Send user prompt to /api/ai
export async function sendUserPrompt(promptType: string, context: any) {
  const res = await axios.post('/api/ai', {
    promptType,
    inputContext: context,
  });
  return res.data;
}

// 2. Calculate pricing via /api/pricing
export async function calculatePricing(config: any) {
  const res = await axios.post('/api/pricing', config);
  return res.data;
}
