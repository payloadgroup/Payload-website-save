import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchPendingUsers();
    fetchAllMembers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/pending-users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const response = await axios.get(`${API}/admin/members`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await axios.post(
        `${API}/admin/update-user-status`,
        { user_id: userId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success(`User ${status}`);
      fetchPendingUsers();
      fetchAllMembers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            data-testid="logo-home-btn"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <PayloadLogo size="default" />
            <div className="font-rajdhani font-bold text-2xl tracking-widest text-payload-neon">
              PAYLOAD
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button
              data-testid="goto-analytics-btn"
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 font-mono text-sm border border-payload-cyan text-payload-cyan px-4 py-2 rounded-none hover:bg-payload-cyan hover:text-black transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              ANALYTICS
            </button>
            <button
              data-testid="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 font-mono text-sm border border-white/20 px-4 py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              DASHBOARD
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-4xl uppercase tracking-wide mb-2">
              ADMIN CONTROL
            </h1>
            <p className="font-mono text-sm text-payload-alert uppercase tracking-widest">
              MEMBERSHIP MANAGEMENT SYSTEM
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-mono text-sm uppercase tracking-widest pb-4 px-6 transition-all ${
                activeTab === 'pending'
                  ? 'text-payload-alert border-b-2 border-payload-alert'
                  : 'text-payload-muted hover:text-payload-text'
              }`}
            >
              PENDING APPROVALS ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`font-mono text-sm uppercase tracking-widest pb-4 px-6 transition-all ${
                activeTab === 'members'
                  ? 'text-payload-neon border-b-2 border-payload-neon'
                  : 'text-payload-muted hover:text-payload-text'
              }`}
            >
              ALL MEMBERS ({allMembers.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center font-mono text-payload-muted">LOADING...</div>
          ) : activeTab === 'pending' ? (
            pendingUsers.length === 0 ? (
            <div className="bg-payload-surface border border-white/10 p-12 rounded-sm text-center">
              <Clock className="w-16 h-16 text-payload-muted mx-auto mb-4" />
              <p className="font-mono text-payload-muted">NO PENDING APPLICATIONS</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  data-testid={`pending-user-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-2">
                        {user.name}
                      </h3>
                      <div className="space-y-1 font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-payload-muted uppercase tracking-widest">EMAIL:</span>
                          <span className="text-payload-text">{user.email}</span>
                        </div>
                        {user.referral_code && (
                          <div className="flex items-center gap-2">
                            <span className="text-payload-muted uppercase tracking-widest">REFERRAL:</span>
                            <span className="text-payload-neon">{user.referral_code}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-payload-muted uppercase tracking-widest">APPLIED:</span>
                          <span className="text-payload-text">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        data-testid={`approve-btn-${index}`}
                        onClick={() => handleUpdateStatus(user.id, 'approved')}
                        className="flex items-center gap-2 font-mono text-sm border border-payload-neon text-payload-neon px-4 py-2 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                        APPROVE
                      </button>
                      <button
                        data-testid={`deny-btn-${index}`}
                        onClick={() => handleUpdateStatus(user.id, 'denied')}
                        className="flex items-center gap-2 font-mono text-sm border border-red-500 text-red-500 px-4 py-2 rounded-none hover:bg-red-500 hover:text-black transition-all duration-300"
                      >
                        <XCircle className="w-4 h-4" />
                        DENY
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;