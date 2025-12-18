import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Clock, BarChart3, Lock, Unlock, Trash2, Users, ShieldOff, Crown, Bell } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPendingUsers(),
      fetchAllMembers(),
      fetchLockedUsers()
    ]);
    setLoading(false);
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const response = await axios.get(`${API}/admin/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchLockedUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/locked-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLockedUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch locked users:', error);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await axios.post(
        `${API}/admin/update-user-status`,
        { user_id: userId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`User ${status}`);
      fetchAllData();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleLockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to lock this account? The member will no longer be able to log in.')) {
      return;
    }
    try {
      await axios.post(
        `${API}/admin/lock-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Account locked successfully');
      fetchAllData();
    } catch (error) {
      console.error('Failed to lock user:', error);
      toast.error(error.response?.data?.detail || 'Failed to lock account');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await axios.post(
        `${API}/admin/unlock-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Account unlocked successfully');
      fetchAllData();
    } catch (error) {
      console.error('Failed to unlock user:', error);
      toast.error(error.response?.data?.detail || 'Failed to unlock account');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${userName}'s account? This action cannot be undone and will remove all their data.`)) {
      return;
    }
    try {
      await axios.delete(
        `${API}/admin/delete-user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Account deleted permanently');
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <button
              data-testid="logo-home-btn"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">
                PAYLOAD
              </div>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                data-testid="goto-management-btn"
                onClick={() => navigate('/admin/management')}
                className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-neon text-payload-neon px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300"
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>MANAGE</span>
              </button>
              <button
                data-testid="goto-notifications-btn"
                onClick={() => navigate('/notifications')}
                className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-green-500 text-green-500 px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-green-500 hover:text-black transition-all duration-300"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>ALERTS</span>
              </button>
              <button
                data-testid="goto-analytics-btn"
                onClick={() => navigate('/analytics')}
                className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-cyan text-payload-cyan px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-payload-cyan hover:text-black transition-all duration-300"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>ANALYTICS</span>
              </button>
              <button
                data-testid="back-to-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>DASHBOARD</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 sm:mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">
              ADMIN CONTROL
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-alert uppercase tracking-widest">
              MEMBERSHIP MANAGEMENT
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-4 mb-6 sm:mb-8 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-mono text-[10px] sm:text-sm uppercase tracking-widest pb-3 sm:pb-4 px-2 sm:px-6 transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                activeTab === 'pending'
                  ? 'text-payload-alert border-b-2 border-payload-alert'
                  : 'text-payload-muted hover:text-payload-text'
              }`}
            >
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PENDING</span> ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`font-mono text-[10px] sm:text-sm uppercase tracking-widest pb-3 sm:pb-4 px-2 sm:px-6 transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                activeTab === 'members'
                  ? 'text-payload-neon border-b-2 border-payload-neon'
                  : 'text-payload-muted hover:text-payload-text'
              }`}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>MEMBERS</span> ({allMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('locked')}
              className={`font-mono text-[10px] sm:text-sm uppercase tracking-widest pb-3 sm:pb-4 px-2 sm:px-6 transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                activeTab === 'locked'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-payload-muted hover:text-payload-text'
              }`}
            >
              <ShieldOff className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>LOCKED</span> ({lockedUsers.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center font-mono text-payload-muted">LOADING...</div>
          ) : activeTab === 'pending' ? (
            /* Pending Users Tab */
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
                    className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-rajdhani font-bold text-lg sm:text-xl uppercase tracking-wide mb-2 truncate">
                          {user.name}
                        </h3>
                        <div className="space-y-1 font-mono text-xs sm:text-sm">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                            <span className="text-payload-muted uppercase tracking-widest">EMAIL:</span>
                            <span className="text-payload-text break-all">{user.email}</span>
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

                      <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                          data-testid={`approve-btn-${index}`}
                          onClick={() => handleUpdateStatus(user.id, 'approved')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-neon text-payload-neon px-3 sm:px-4 py-2 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          APPROVE
                        </button>
                        <button
                          data-testid={`deny-btn-${index}`}
                          onClick={() => handleUpdateStatus(user.id, 'denied')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-red-500 text-red-500 px-3 sm:px-4 py-2 rounded-none hover:bg-red-500 hover:text-black transition-all duration-300"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          DENY
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : activeTab === 'members' ? (
            /* All Members Tab */
            allMembers.length === 0 ? (
              <div className="bg-payload-surface border border-white/10 p-12 rounded-sm text-center">
                <Users className="w-16 h-16 text-payload-muted mx-auto mb-4" />
                <p className="font-mono text-payload-muted">NO APPROVED MEMBERS</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    data-testid={`member-item-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-rajdhani font-bold text-lg sm:text-xl uppercase tracking-wide text-payload-neon truncate">
                            {member.name}
                          </h3>
                          {member.credit_score && (
                            <span className="font-mono text-xs bg-payload-neon/20 text-payload-neon px-2 py-0.5 rounded-sm">
                              CS: {member.credit_score}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 font-mono text-xs sm:text-sm">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                            <span className="text-payload-muted uppercase tracking-widest">EMAIL:</span>
                            <span className="text-payload-text break-all">{member.email}</span>
                          </div>
                          {member.referral_code && (
                            <div className="flex items-center gap-2">
                              <span className="text-payload-muted uppercase tracking-widest">REFERRAL:</span>
                              <span className="text-payload-neon">{member.referral_code}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-payload-muted uppercase tracking-widest">JOINED:</span>
                              <span className="text-payload-text">{new Date(member.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-payload-muted uppercase tracking-widest">STATUS:</span>
                              <span className="text-payload-neon uppercase">{member.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lock Button */}
                      <button
                        data-testid={`lock-btn-${index}`}
                        onClick={() => handleLockUser(member.id)}
                        className="flex items-center justify-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-alert text-payload-alert px-3 sm:px-4 py-2 rounded-none hover:bg-payload-alert hover:text-black transition-all duration-300 w-full sm:w-auto"
                      >
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                        LOCK
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            /* Locked Accounts Tab */
            lockedUsers.length === 0 ? (
              <div className="bg-payload-surface border border-white/10 p-12 rounded-sm text-center">
                <ShieldOff className="w-16 h-16 text-payload-muted mx-auto mb-4" />
                <p className="font-mono text-payload-muted">NO LOCKED ACCOUNTS</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lockedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    data-testid={`locked-user-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-payload-surface border border-red-500/30 p-4 sm:p-6 rounded-sm hover:border-red-500/50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-rajdhani font-bold text-lg sm:text-xl uppercase tracking-wide text-red-500 truncate">
                            {user.name}
                          </h3>
                          <span className="font-mono text-[10px] sm:text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-sm">
                            LOCKED
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-xs sm:text-sm">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                            <span className="text-payload-muted uppercase tracking-widest">EMAIL:</span>
                            <span className="text-payload-text break-all">{user.email}</span>
                          </div>
                          {user.referral_code && (
                            <div className="flex items-center gap-2">
                              <span className="text-payload-muted uppercase tracking-widest">REFERRAL:</span>
                              <span className="text-payload-neon">{user.referral_code}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-payload-muted uppercase tracking-widest">JOINED:</span>
                            <span className="text-payload-text">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unlock and Delete Buttons */}
                      <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                          data-testid={`unlock-btn-${index}`}
                          onClick={() => handleUnlockUser(user.id)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-neon text-payload-neon px-3 sm:px-4 py-2 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300"
                        >
                          <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />
                          UNLOCK
                        </button>
                        <button
                          data-testid={`delete-btn-${index}`}
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-red-500 text-red-500 px-3 sm:px-4 py-2 rounded-none hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          DELETE
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
