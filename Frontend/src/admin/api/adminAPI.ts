import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance for admin API calls
const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminAuthAPI = {
  // Admin authentication
  login: async (credentials: { email: string; password: string }) => {
    const response = await adminAPI.post('/login', credentials);
    return response.data;
  },

  verify: async () => {
    const response = await adminAPI.get('/verify');
    return response.data;
  },

  logout: async () => {
    const response = await adminAPI.post('/logout');
    return response.data;
  }
};

export const adminUsersAPI = {
  // User management
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await adminAPI.get('/users', { params });
    return response.data;
  },

  getUser: async (userId: string) => {
    const response = await adminAPI.get(`/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const response = await adminAPI.patch(`/users/${userId}/status`, { status });
    return response.data;
  },

  updateUserPlan: async (userId: string, plan: string) => {
    const response = await adminAPI.patch(`/users/${userId}/plan`, { plan });
    return response.data;
  },

  deleteUser: async (userId: string, permanent = false) => {
    const response = await adminAPI.delete(`/users/${userId}?permanent=${permanent}`);
    return response.data;
  },

  getUserSessions: async (userId: string, params: { page?: number; limit?: number } = {}) => {
    const response = await adminAPI.get(`/users/${userId}/sessions`, { params });
    return response.data;
  }
};

export const adminServicesAPI = {
  // Service management
  getServices: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await adminAPI.get('/services', { params });
    return response.data;
  },

  getService: async (serviceId: string) => {
    const response = await adminAPI.get(`/services/${serviceId}`);
    return response.data;
  },

  createService: async (serviceData: {
    name: string;
    category: string;
    description: string;
    unitPrice: number;
    currency?: string;
    requiredFields?: string[];
    status?: string;
  }) => {
    const response = await adminAPI.post('/services', serviceData);
    return response.data;
  },

  updateService: async (serviceId: string, serviceData: Partial<{
    name: string;
    category: string;
    description: string;
    unitPrice: number;
    currency: string;
    requiredFields: string[];
    status: string;
  }>) => {
    const response = await adminAPI.put(`/services/${serviceId}`, serviceData);
    return response.data;
  },

  deleteService: async (serviceId: string, permanent = false) => {
    const response = await adminAPI.delete(`/services/${serviceId}?permanent=${permanent}`);
    return response.data;
  },

  updateServiceStatus: async (serviceId: string, status: string) => {
    const response = await adminAPI.patch(`/services/${serviceId}/status`, { status });
    return response.data;
  },

  getCategories: async () => {
    const response = await adminAPI.get('/services/meta/categories');
    return response.data;
  }
};

export const adminAnalyticsAPI = {
  // Analytics and metrics
  getMetrics: async () => {
    const response = await adminAPI.get('/analytics/metrics');
    return response.data;
  },

  getUserAnalytics: async (period = '30d') => {
    const response = await adminAPI.get(`/analytics/users/analytics?period=${period}`);
    return response.data;
  },

  getSessionAnalytics: async (period = '30d') => {
    const response = await adminAPI.get(`/analytics/sessions/analytics?period=${period}`);
    return response.data;
  },

  getServiceAnalytics: async (period = '30d') => {
    const response = await adminAPI.get(`/analytics/services/analytics?period=${period}`);
    return response.data;
  },

  getRevenueAnalytics: async (period = '30d') => {
    const response = await adminAPI.get(`/analytics/revenue/analytics?period=${period}`);
    return response.data;
  }
};

export default {
  auth: adminAuthAPI,
  users: adminUsersAPI,
  services: adminServicesAPI,
  analytics: adminAnalyticsAPI
};
