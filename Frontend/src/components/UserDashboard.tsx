import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Download, 
  User, 
  Settings, 
  LogOut,
  Cloud,
  BarChart3,
  Calendar,
  DollarSign,
  ChevronRight,
  Search
} from 'lucide-react';
import { chatAPI } from '../api';

interface UserDashboardProps {
  user: {
    name: string;
    email: string;
    plan: string;
  };
  onStartNewChat: () => void;
  onReopenChat: (sessionId: string) => void;
  onLogout: () => void;
  onViewProfile: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onStartNewChat,
  onReopenChat,
  onLogout,
  onViewProfile
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalEstimatedCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'draft'>('all');

  // Load real chat sessions from API
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load sessions with current filter
        const params = {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
          limit: 50 // Load more sessions for better UX
        };
        
        const [sessionsResponse, statsResponse] = await Promise.all([
          chatAPI.getSessions(params),
          chatAPI.getStats().catch(() => ({ success: false, stats: { totalSessions: 0, completedSessions: 0, totalEstimatedCost: 0 } }))
        ]);
        
        if (sessionsResponse.success) {
          setSessions(sessionsResponse.sessions || []);
        } else {
          setError('Failed to load sessions');
          setSessions([]);
        }
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        setError('Failed to load chat data');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadChatSessions();
  }, [filterStatus, searchTerm]); // Reload when filter or search changes

  const filteredSessions = sessions.filter((session: any) => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (session.services && Array.isArray(session.services) && 
                          session.services.some((service: any) => {
                            const serviceName = typeof service === 'string' ? service : service.name || '';
                            return serviceName.toLowerCase().includes(searchTerm.toLowerCase());
                          }));
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⏳';
      case 'draft': return '📝';
      default: return '📄';
    }
  };

  const handleDownloadQuote = async (sessionId: string) => {
    try {
      // TODO: Implement quote download functionality
      console.log('Downloading quote for session:', sessionId);
      alert(`Quote download feature will be implemented for session ${sessionId}`);
    } catch (error) {
      console.error('Error downloading quote:', error);
      setError('Failed to download quote');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await chatAPI.deleteSession(sessionId);
      if (response.success) {
        // Remove from local state
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
        // Update stats
        setStats(prev => ({
          ...prev,
          totalSessions: prev.totalSessions - 1
        }));
      } else {
        setError('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
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
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCCC AI Advisor</h1>
                <p className="text-xs text-gray-500">Cloud Pricing & Solutions</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-orange-500 font-medium">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">My Chats</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Profile</a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.plan} Plan</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onViewProfile}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
              <p className="text-orange-100 mb-4">
                Ready to explore cloud solutions? Start a new consultation or continue where you left off.
              </p>
              <button
                onClick={onStartNewChat}
                className="bg-white text-orange-500 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Start New Chat
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.totalSessions}
                    </p>
                    <p className="text-gray-600">Total Sessions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.completedSessions}
                    </p>
                    <p className="text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : `${stats.totalEstimatedCost.toLocaleString()} SAR`}
                    </p>
                    <p className="text-gray-600">Total Estimated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sessions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-xl font-semibold text-gray-900">Your Previous Sessions</h3>
                  
                  {/* Search and Filter */}
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Loading sessions...</h4>
                    <p className="text-gray-600">Please wait while we fetch your chat history.</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h4>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Start your first AI consultation to see your sessions here.'
                      }
                    </p>
                    <button
                      onClick={onStartNewChat}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Start New Chat
                    </button>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div key={session.sessionId} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{session.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)} {session.status.replace('-', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'Unknown date'}
                            </div>
                            {session.services && session.services.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Cloud className="h-4 w-4" />
                                {Array.isArray(session.services) 
                                  ? session.services.map((s: any) => typeof s === 'string' ? s : s.name || 'Service').join(', ')
                                  : 'Services'
                                }
                              </div>
                            )}
                            {(session.estimatedCost || session.pricing?.total) && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {session.pricing?.total 
                                  ? `${session.pricing.total.toLocaleString()} ${session.pricing.currency || 'SAR'}/month`
                                  : session.estimatedCost > 0
                                  ? `${session.estimatedCost.toLocaleString()} SAR/month`
                                  : 'Pricing pending'
                                }
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-sm">
                            {session.services && Array.isArray(session.services) && session.services.length > 0 ? (
                              <>
                                Services: {session.services.map((s: any) => {
                                  if (typeof s === 'string') return s;
                                  if (s && s.name) return s.name;
                                  if (s && s.type) return s.type;
                                  return 'Service';
                                }).join(', ')} • Last updated: {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : 'Unknown'}
                              </>
                            ) : session.title && session.title !== 'AI Consultation' ? (
                              <>Session: {session.title} • Last updated: {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : 'Unknown'}</>
                            ) : (
                              <>Session ID: {session.sessionId} • Last updated: {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : 'Unknown'}</>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {session.status === 'completed' && (
                            <button
                              onClick={() => handleDownloadQuote(session.sessionId)}
                              className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Download Quote"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.sessionId)}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Session"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => onReopenChat(session.sessionId)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Reopen Chat
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="text-sm font-medium text-gray-900">{user.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions</span>
                  <span className="text-sm font-medium text-gray-900">{sessions.length}</span>
                </div>
              </div>
              
              <button
                onClick={onViewProfile}
                className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={onStartNewChat}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-700">New Consultation</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700">Download Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Usage Analytics</span>
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is here to help you get the most out of SCCC AI Advisor.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;