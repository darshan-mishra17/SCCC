import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Settings,
  LogOut,
  Cloud,
  BarChart3,
  Calendar,
  Activity,
  Shield,
  Database,
  Server,
  HardDrive,
  Globe,
  Lock,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import adminAPI from '../api/adminAPI';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  sessions: number;
  lastLogin: string;
  status: 'active' | 'inactive';
  plan: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  currency: string;
  requiredFields: string[];
  status: 'active' | 'inactive';
}

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
}

interface AnalyticsData {
  userAnalytics: {
    registrations: Array<{ _id: string; count: number }>;
    planDistribution: Array<{ _id: string; count: number }>;
  };
  sessionAnalytics: {
    sessionsByDay: Array<{ _id: string; count: number }>;
    avgDuration: number;
    totalSessions: number;
  };
  revenueData: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageOrder: number;
    revenueByService: Array<{ serviceName: string; revenue: number }>;
  };
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'users' | 'analytics'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load analytics when tab changes or period changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab, analyticsPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      
      // Load user analytics
      const userAnalyticsResponse = await adminAPI.analytics.getUserAnalytics(analyticsPeriod);
      
      // Load session analytics
      const sessionAnalyticsResponse = await adminAPI.analytics.getSessionAnalytics(analyticsPeriod);
      
      // Load service analytics
      const serviceAnalyticsResponse = await adminAPI.analytics.getServiceAnalytics(analyticsPeriod);
      
      // Load revenue analytics
      const revenueAnalyticsResponse = await adminAPI.analytics.getRevenueAnalytics(analyticsPeriod);
      
      if (userAnalyticsResponse.success && sessionAnalyticsResponse.success && 
          serviceAnalyticsResponse.success && revenueAnalyticsResponse.success) {
        setAnalyticsData({
          userAnalytics: userAnalyticsResponse.analytics,
          sessionAnalytics: sessionAnalyticsResponse.analytics,
          revenueData: revenueAnalyticsResponse.analytics
        });
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      // Fallback to mock data if API fails
      setAnalyticsData({
        userAnalytics: {
          registrations: [],
          planDistribution: []
        },
        sessionAnalytics: {
          sessionsByDay: [],
          avgDuration: 0,
          totalSessions: 0
        },
        revenueData: {
          totalRevenue: 125430,
          monthlyRevenue: 15670,
          averageOrder: 3890,
          revenueByService: [
            { serviceName: 'ECS', revenue: 45000 },
            { serviceName: 'OSS', revenue: 32000 },
            { serviceName: 'TDSQL', revenue: 28000 },
            { serviceName: 'CDN', revenue: 15000 },
            { serviceName: 'WAF', revenue: 5430 }
          ]
        }
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Prepare chart data functions
  const prepareSessionTrendsData = () => {
    if (!analyticsData?.sessionAnalytics.sessionsByDay) return null;
    
    const sessions = analyticsData.sessionAnalytics.sessionsByDay;
    const labels = sessions.map(s => new Date(s._id).toLocaleDateString());
    const data = sessions.map(s => s.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Chat Sessions',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareServiceUsageData = () => {
    if (!analyticsData?.revenueData.revenueByService) return null;
    
    const serviceData = analyticsData.revenueData.revenueByService;
    const labels = serviceData.map(s => s.serviceName);
    const data = serviceData.map(s => s.revenue);
    
    const colors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(168, 85, 247, 0.8)',
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareUserRegistrationData = () => {
    if (!analyticsData?.userAnalytics.registrations) return null;
    
    const registrations = analyticsData.userAnalytics.registrations;
    const labels = registrations.map(r => new Date(r._id).toLocaleDateString());
    const data = registrations.map(r => r.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'New Users',
          data,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load metrics
      const metricsResponse = await adminAPI.analytics.getMetrics();
      if (metricsResponse.success) {
        setMetrics(metricsResponse.metrics);
      }

      // Load users
      const usersResponse = await adminAPI.users.getUsers({ limit: 50 });
      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }

      // Load services
      const servicesResponse = await adminAPI.services.getServices({ limit: 50 });
      if (servicesResponse.success) {
        setServices(servicesResponse.services);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock users data (fallback)
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@techcorp.sa',
        company: 'TechCorp Saudi',
        sessions: 12,
        lastLogin: '2025-01-15',
        status: 'active',
        plan: 'Professional'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@innovate.com',
        company: 'Innovate Solutions',
        sessions: 8,
        lastLogin: '2025-01-14',
        status: 'active',
        plan: 'Enterprise'
      },
      {
        id: '3',
        name: 'Mohammed Hassan',
        email: 'mohammed@startup.sa',
        company: 'StartupSA',
        sessions: 3,
        lastLogin: '2025-01-10',
        status: 'inactive',
        plan: 'Basic'
      }
    ];

    // Mock services data (fallback)
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'ECS',
        category: 'Compute',
        description: 'Elastic Compute Service - Scalable cloud computing',
        unitPrice: 0.05,
        currency: 'SAR',
        requiredFields: ['instanceType', 'instanceCount', 'storageSize', 'bandwidth'],
        status: 'active'
      },
      {
        id: '2',
        name: 'TDSQL',
        category: 'Database',
        description: 'Tencent Distributed SQL Database',
        unitPrice: 0.12,
        currency: 'SAR',
        requiredFields: ['engine', 'instanceSize', 'storageSize', 'backupRetention'],
        status: 'active'
      },
      {
        id: '3',
        name: 'OSS',
        category: 'Storage',
        description: 'Object Storage Service',
        unitPrice: 0.02,
        currency: 'SAR',
        requiredFields: ['storageClass', 'capacity', 'region'],
        status: 'active'
      },
      {
        id: '4',
        name: 'WAF',
        category: 'Security',
        description: 'Web Application Firewall',
        unitPrice: 0.08,
        currency: 'SAR',
        requiredFields: ['protectionLevel', 'bandwidth', 'domains'],
        status: 'active'
      }
    ];

    // Mock metrics data (fallback)
    const mockMetrics: Metric[] = [
      {
        label: 'Total Users',
        value: '1,247',
        change: '+12%',
        trend: 'up',
        icon: Users
      },
      {
        label: 'Chat Sessions',
        value: '3,891',
        change: '+8%',
        trend: 'up',
        icon: MessageSquare
      },
      {
        label: 'Active Today',
        value: '156',
        change: '+24%',
        trend: 'up',
        icon: Activity
      },
      {
        label: 'Conversion Rate',
        value: '68.5%',
        change: '+5.2%',
        trend: 'up',
        icon: TrendingUp
      }
    ];

    setUsers(mockUsers);
    setServices(mockServices);
    setMetrics(mockMetrics);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'compute': return Server;
      case 'database': return Database;
      case 'storage': return HardDrive;
      case 'security': return Shield;
      case 'network': return Globe;
      default: return Cloud;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || service.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const ServiceModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    service?: Service | null;
    onSave: (service: Partial<Service>) => void;
  }> = ({ isOpen, onClose, service, onSave }) => {
    const [formData, setFormData] = useState({
      name: service?.name || '',
      category: service?.category || '',
      description: service?.description || '',
      unitPrice: service?.unitPrice || 0,
      requiredFields: service?.requiredFields?.join(', ') || '',
      status: service?.status || 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        requiredFields: formData.requiredFields.split(',').map(f => f.trim()),
        unitPrice: Number(formData.unitPrice)
      });
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {service ? 'Edit Service' : 'Add New Service'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select Category</option>
                <option value="Compute">Compute</option>
                <option value="Database">Database</option>
                <option value="Storage">Storage</option>
                <option value="Security">Security</option>
                <option value="Network">Network</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (SAR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Fields (comma-separated)
              </label>
              <input
                type="text"
                value={formData.requiredFields}
                onChange={(e) => setFormData({...formData, requiredFields: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="instanceType, storageSize, bandwidth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {service ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSaveService = async (serviceData: Partial<Service>) => {
    try {
      if (editingService) {
        // Update existing service
        const response = await adminAPI.services.updateService(editingService.id, serviceData);
        if (response.success) {
          setServices(services.map(s => 
            s.id === editingService.id 
              ? { ...s, ...response.service }
              : s
          ));
          alert('Service updated successfully');
        }
      } else {
        // Add new service
        const response = await adminAPI.services.createService(serviceData as any);
        if (response.success) {
          setServices([...services, response.service]);
          alert('Service created successfully');
        }
      }
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await adminAPI.services.deleteService(serviceId);
        if (response.success) {
          setServices(services.filter(s => s.id !== serviceId));
          alert('Service deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const response = await adminAPI.users.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, status: newStatus }
            : u
        ));
        alert(`User status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCCC Admin</h1>
                <p className="text-xs text-gray-500">Cloud Advisor Management</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { key: 'services', label: 'Services', icon: Cloud },
                { key: 'users', label: 'Users', icon: Users },
                { key: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === key 
                      ? 'text-orange-500 bg-orange-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Admin Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                      <p className={`text-sm mt-1 ${getTrendColor(metric.trend)}`}>
                        {metric.change} from last month
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <metric.icon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
                <div className="space-y-4">
                  {[
                    { user: 'Ahmed Al-Rashid', service: 'ECS + TDSQL', cost: 'SAR 4,556.30', time: '2 hours ago' },
                    { user: 'Sarah Johnson', service: 'OSS + WAF', cost: 'SAR 2,340.50', time: '4 hours ago' },
                    { user: 'Mohammed Hassan', service: 'ECS', cost: 'SAR 1,890.75', time: '6 hours ago' }
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{session.user}</p>
                        <p className="text-sm text-gray-600">{session.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-orange-600">{session.cost}</p>
                        <p className="text-xs text-gray-500">{session.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h3>
                <div className="space-y-4">
                  {[
                    { name: 'ECS', usage: '85%', requests: 342 },
                    { name: 'TDSQL', usage: '72%', requests: 289 },
                    { name: 'OSS', usage: '58%', requests: 234 },
                    { name: 'WAF', usage: '41%', requests: 167 }
                  ].map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <span className="text-sm text-gray-600">{service.requests} requests</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: service.usage }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Management */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowServiceModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.map((service) => {
                      const CategoryIcon = getCategoryIcon(service.category);
                      return (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <CategoryIcon className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                <div className="text-sm text-gray-500">{service.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {service.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.currency} {service.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              service.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingService(service);
                                  setShowServiceModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900 p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Users
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.sessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              user.status === 'active'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value as '7d' | '30d' | '90d')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading analytics...</p>
              </div>
            ) : (
              <>
                {/* Key Metrics Row */}
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analyticsData?.sessionAnalytics.totalSessions?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Session Duration</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(analyticsData?.sessionAnalytics.avgDuration || 0)}min
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {users.length.toLocaleString()}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Services</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {services.filter(s => s.status === 'active').length}
                        </p>
                      </div>
                      <Cloud className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Trends</h3>
                    <div className="h-64">
                      {prepareSessionTrendsData() ? (
                        <Bar 
                          data={prepareSessionTrendsData()!} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No session data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Usage</h3>
                    <div className="h-64">
                      {prepareServiceUsageData() ? (
                        <Pie 
                          data={prepareServiceUsageData()!} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right' as const,
                              },
                              title: {
                                display: false,
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No service data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Registrations and Revenue */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registrations</h3>
                    <div className="h-64">
                      {prepareUserRegistrationData() ? (
                        <Line 
                          data={prepareUserRegistrationData()!} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No user registration data</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          SAR {analyticsData?.revenueData.totalRevenue?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          SAR {analyticsData?.revenueData.monthlyRevenue?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">This Month</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          SAR {analyticsData?.revenueData.averageOrder?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">Average Order</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Service Modal */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        service={editingService}
        onSave={handleSaveService}
      />
    </div>
  );
};

export default AdminDashboard;