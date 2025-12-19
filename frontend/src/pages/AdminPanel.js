import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Clock, BarChart3, Lock, Unlock, Trash2, Users, ShieldOff, Crown, Bell, UserPlus, Eye, EyeOff, X, User, Mail, Phone, Calendar, MapPin, CreditCard, Award, Hash } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_CONFIG = {
  junior_recruit: { label: 'JUNIOR RECRUIT', color: 'text-gray-400', icon: '📝' },
  front_line: { label: 'FRONT-LINE', color: 'text-blue-400', icon: '🕵️' },
  mid_level_manager: { label: 'MID-LEVEL MANAGER', color: 'text-purple-400', icon: '📊' },
  senior_manager: { label: 'SENIOR MANAGER', color: 'text-orange-400', icon: '🎯' },
  top_leadership: { label: 'TOP LEADERSHIP', color: 'text-yellow-400', icon: '👑' }
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [deniedUsers, setDeniedUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', mobile: '', date_of_birth: '', tier: 'junior_recruit' });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchPendingUsers(), fetchAllMembers(), fetchLockedUsers(), fetchDeniedUsers(), fetchDeletedUsers()]);
    setLoading(false);
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/pending-users`, { headers: { Authorization: `Bearer ${token}` } });
      setPendingUsers(response.data);
    } catch (error) { console.error('Failed to fetch pending users:', error); }
  };

  const fetchAllMembers = async () => {
    try {
      const response = await axios.get(`${API}/admin/members`, { headers: { Authorization: `Bearer ${token}` } });
      setAllMembers(response.data);
    } catch (error) { console.error('Failed to fetch members:', error); }
  };

  const fetchLockedUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/locked-users`, { headers: { Authorization: `Bearer ${token}` } });
      setLockedUsers(response.data);
    } catch (error) { console.error('Failed to fetch locked users:', error); }
  };

  const fetchDeniedUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/denied-users`, { headers: { Authorization: `Bearer ${token}` } });
      setDeniedUsers(response.data);
    } catch (error) { console.error('Failed to fetch denied users:', error); }
  };

  const fetchDeletedUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/deleted-users`, { headers: { Authorization: `Bearer ${token}` } });
      setDeletedUsers(response.data);
    } catch (error) { console.error('Failed to fetch deleted users:', error); }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await axios.post(`${API}/admin/update-user-status`, { user_id: userId, status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`User ${status}`);
      fetchAllData();
    } catch (error) { toast.error('Failed to update user status'); }
  };

  const handleLockUser = async (userId) => {
    if (!window.confirm('Lock this account?')) return;
    try {
      await axios.post(`${API}/admin/lock-user/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Account locked');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to lock'); }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/unlock-user/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Account unlocked');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to unlock'); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}'s account?`)) return;
    try {
      await axios.delete(`${API}/admin/delete-user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Account moved to deleted');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to delete'); }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/restore-user/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User restored to pending');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to restore'); }
  };

  const handlePermanentDelete = async (userId, userName) => {
    if (!window.confirm(`PERMANENTLY delete ${userName}'s account? This cannot be undone!`)) return;
    try {
      await axios.delete(`${API}/admin/permanent-delete-user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Account permanently deleted');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to permanently delete'); }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API}/admin/create-member`, createForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Member created successfully');
      setShowCreateForm(false);
      setCreateForm({ name: '', email: '', password: '', mobile: '', date_of_birth: '', tier: 'junior_recruit' });
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to create member'); }
    setCreating(false);
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const openProfileModal = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const ProfileModal = () => {
    if (!selectedUser) return null;
    return (
      <AnimatePresence>
        {showProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-payload-surface border border-payload-neon/50 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-payload-neon/10 border-b border-payload-neon/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-payload-neon/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-payload-neon" />
                  </div>
                  <div>
                    <h2 className="font-rajdhani font-bold text-xl uppercase text-payload-neon">{selectedUser.name}</h2>
                    <span className="font-mono text-xs text-payload-muted">{TIER_CONFIG[selectedUser.tier]?.icon} {TIER_CONFIG[selectedUser.tier]?.label || 'JUNIOR RECRUIT'}</span>
                  </div>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/10 rounded-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Full Name</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{selectedUser.name || 'N/A'}</p>
                  </div>

                  {/* Age */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Age</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{calculateAge(selectedUser.date_of_birth)} years old</p>
                  </div>

                  {/* Email */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm sm:col-span-2">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Email</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text break-all">{selectedUser.email || 'N/A'}</p>
                  </div>

                  {/* Mobile */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Mobile</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{selectedUser.mobile || 'N/A'}</p>
                  </div>

                  {/* Date of Birth */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Date of Birth</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {/* Address */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm sm:col-span-2">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Address</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{selectedUser.address || 'Not provided'}</p>
                  </div>

                  {/* Credit Score */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Credit Score</span>
                    </div>
                    <p className={`font-mono text-sm ${selectedUser.credit_score ? 'text-payload-neon' : 'text-payload-muted'}`}>{selectedUser.credit_score || 'Not set'}</p>
                  </div>

                  {/* Tier */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Award className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Member Tier</span>
                    </div>
                    <p className={`font-mono text-sm ${TIER_CONFIG[selectedUser.tier]?.color || 'text-gray-400'}`}>
                      {TIER_CONFIG[selectedUser.tier]?.icon} {TIER_CONFIG[selectedUser.tier]?.label || 'JUNIOR RECRUIT'}
                    </p>
                  </div>

                  {/* Referral Code */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Referral Code</span>
                    </div>
                    <p className="font-mono text-sm text-payload-cyan">{selectedUser.own_referral_code || 'N/A'}</p>
                  </div>

                  {/* Joined Date */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Joined</span>
                    </div>
                    <p className="font-mono text-sm text-payload-text">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {/* Status */}
                  <div className="bg-black/30 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-payload-muted mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">Status</span>
                    </div>
                    <p className={`font-mono text-sm uppercase ${selectedUser.status === 'approved' ? 'text-payload-neon' : selectedUser.status === 'locked' ? 'text-red-500' : 'text-payload-alert'}`}>
                      {selectedUser.status || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 p-4 flex justify-end">
                <button onClick={() => setShowProfileModal(false)} className="font-mono text-xs border border-white/20 px-6 py-2 hover:bg-white/10 transition-colors">
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <ProfileModal />
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button data-testid="logo-home-btn" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 sm:gap-3 hover:opacity-80">
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-lg sm:text-2xl tracking-widest text-payload-neon">PAYLOAD</div>
            </button>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button onClick={() => navigate('/admin/management')} className="flex items-center gap-1 font-mono text-[10px] sm:text-xs border border-payload-neon text-payload-neon px-2 py-1.5 hover:bg-payload-neon hover:text-black transition-all"><Crown className="w-3 h-3" /><span className="hidden sm:inline">MANAGE</span></button>
              <button onClick={() => navigate('/notifications')} className="flex items-center gap-1 font-mono text-[10px] sm:text-xs border border-green-500 text-green-500 px-2 py-1.5 hover:bg-green-500 hover:text-black transition-all"><Bell className="w-3 h-3" /><span className="hidden sm:inline">ALERTS</span></button>
              <button onClick={() => navigate('/analytics')} className="flex items-center gap-1 font-mono text-[10px] sm:text-xs border border-payload-cyan text-payload-cyan px-2 py-1.5 hover:bg-payload-cyan hover:text-black transition-all"><BarChart3 className="w-3 h-3" /><span className="hidden sm:inline">ANALYTICS</span></button>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 font-mono text-[10px] sm:text-xs border border-white/20 px-2 py-1.5 hover:border-white hover:bg-white/5 transition-all"><ArrowLeft className="w-3 h-3" /><span className="hidden sm:inline">DASHBOARD</span></button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">ADMIN CONTROL</h1>
              <p className="font-mono text-xs sm:text-sm text-payload-alert uppercase tracking-widest">MEMBERSHIP MANAGEMENT</p>
            </div>
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 font-mono text-xs border border-payload-neon text-payload-neon px-4 py-2 hover:bg-payload-neon hover:text-black transition-all">
              <UserPlus className="w-4 h-4" /> CREATE MEMBER
            </button>
          </div>

          {/* Create Member Form */}
          {showCreateForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-payload-surface border border-payload-neon/50 p-6 rounded-sm mb-6">
              <h3 className="font-rajdhani font-bold text-xl mb-4">CREATE NEW MEMBER</h3>
              <form onSubmit={handleCreateMember} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="Full Name" value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} className="bg-black border border-white/20 p-3 font-mono text-sm" />
                <input required type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} className="bg-black border border-white/20 p-3 font-mono text-sm" />
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} className="w-full bg-black border border-white/20 p-3 pr-10 font-mono text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-payload-muted">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <input placeholder="Mobile (+61...)" value={createForm.mobile} onChange={(e) => setCreateForm({...createForm, mobile: e.target.value})} className="bg-black border border-white/20 p-3 font-mono text-sm" />
                <input type="date" placeholder="Date of Birth" value={createForm.date_of_birth} onChange={(e) => setCreateForm({...createForm, date_of_birth: e.target.value})} className="bg-black border border-white/20 p-3 font-mono text-sm" />
                <select value={createForm.tier} onChange={(e) => setCreateForm({...createForm, tier: e.target.value})} className="bg-black border border-white/20 p-3 font-mono text-sm">
                  {Object.entries(TIER_CONFIG).map(([t, c]) => <option key={t} value={t}>{c.label}</option>)}
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <button type="submit" disabled={creating} className="font-mono text-sm bg-payload-neon text-black px-6 py-2 disabled:opacity-50">{creating ? 'CREATING...' : 'CREATE'}</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="font-mono text-sm border border-white/20 px-6 py-2">CANCEL</button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-4 mb-6 border-b border-white/10 overflow-x-auto">
            <button onClick={() => setActiveTab('pending')} className={`font-mono text-[10px] sm:text-sm uppercase pb-3 px-2 sm:px-6 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'pending' ? 'text-payload-alert border-b-2 border-payload-alert' : 'text-payload-muted hover:text-payload-text'}`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" /><span>PENDING</span> ({pendingUsers.length})
            </button>
            <button onClick={() => setActiveTab('members')} className={`font-mono text-[10px] sm:text-sm uppercase pb-3 px-2 sm:px-6 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'members' ? 'text-payload-neon border-b-2 border-payload-neon' : 'text-payload-muted hover:text-payload-text'}`}>
              <Users className="w-3 h-3 sm:w-4 sm:h-4" /><span>MEMBERS</span> ({allMembers.length})
            </button>
            <button onClick={() => setActiveTab('locked')} className={`font-mono text-[10px] sm:text-sm uppercase pb-3 px-2 sm:px-6 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'locked' ? 'text-red-500 border-b-2 border-red-500' : 'text-payload-muted hover:text-payload-text'}`}>
              <ShieldOff className="w-3 h-3 sm:w-4 sm:h-4" /><span>LOCKED</span> ({lockedUsers.length})
            </button>
          </div>

          {loading ? <div className="text-center font-mono text-payload-muted">LOADING...</div> : activeTab === 'pending' ? (
            pendingUsers.length === 0 ? <div className="bg-payload-surface border border-white/10 p-12 text-center"><Clock className="w-16 h-16 text-payload-muted mx-auto mb-4" /><p className="font-mono text-payload-muted">NO PENDING APPLICATIONS</p></div> : (
              <div className="space-y-4">
                {pendingUsers.map((user, index) => (
                  <motion.div key={user.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 onClick={() => openProfileModal(user)} className="font-rajdhani font-bold text-lg uppercase mb-2 truncate cursor-pointer hover:text-payload-neon transition-colors">{user.name}</h3>
                        <div className="space-y-1 font-mono text-xs">
                          <div><span className="text-payload-muted">EMAIL: </span><span className="break-all">{user.email}</span></div>
                          {user.referral_code && <div><span className="text-payload-muted">REFERRAL: </span><span className="text-payload-neon">{user.referral_code}</span></div>}
                          <div><span className="text-payload-muted">APPLIED: </span>{new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(user.id, 'approved')} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 font-mono text-xs border border-payload-neon text-payload-neon px-3 py-2 hover:bg-payload-neon hover:text-black"><CheckCircle className="w-3 h-3" />APPROVE</button>
                        <button onClick={() => handleUpdateStatus(user.id, 'denied')} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 font-mono text-xs border border-red-500 text-red-500 px-3 py-2 hover:bg-red-500 hover:text-black"><XCircle className="w-3 h-3" />DENY</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : activeTab === 'members' ? (
            allMembers.length === 0 ? <div className="bg-payload-surface border border-white/10 p-12 text-center"><Users className="w-16 h-16 text-payload-muted mx-auto mb-4" /><p className="font-mono text-payload-muted">NO APPROVED MEMBERS</p></div> : (
              <div className="space-y-4">
                {allMembers.map((member, index) => (
                  <motion.div key={member.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 onClick={() => openProfileModal(member)} className="font-rajdhani font-bold text-lg uppercase text-payload-neon truncate cursor-pointer hover:text-white transition-colors">{member.name}</h3>
                          {member.credit_score && <span className="font-mono text-xs bg-payload-neon/20 text-payload-neon px-2 py-0.5">CS: {member.credit_score}</span>}
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-white/10">{TIER_CONFIG[member.tier]?.icon} {TIER_CONFIG[member.tier]?.label || 'JUNIOR'}</span>
                        </div>
                        <div className="space-y-1 font-mono text-xs">
                          <div><span className="text-payload-muted">EMAIL: </span><span className="break-all">{member.email}</span></div>
                          <div><span className="text-payload-muted">JOINED: </span>{new Date(member.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button onClick={() => handleLockUser(member.id)} className="flex items-center justify-center gap-1 font-mono text-xs border border-payload-alert text-payload-alert px-3 py-2 hover:bg-payload-alert hover:text-black"><Lock className="w-3 h-3" />LOCK</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            lockedUsers.length === 0 ? <div className="bg-payload-surface border border-white/10 p-12 text-center"><ShieldOff className="w-16 h-16 text-payload-muted mx-auto mb-4" /><p className="font-mono text-payload-muted">NO LOCKED ACCOUNTS</p></div> : (
              <div className="space-y-4">
                {lockedUsers.map((user, index) => (
                  <motion.div key={user.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-payload-surface border border-red-500/30 p-4 sm:p-6 rounded-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 onClick={() => openProfileModal(user)} className="font-rajdhani font-bold text-lg uppercase text-red-500 truncate cursor-pointer hover:text-red-300 transition-colors">{user.name}</h3>
                          <span className="font-mono text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5">LOCKED</span>
                        </div>
                        <div className="space-y-1 font-mono text-xs">
                          <div><span className="text-payload-muted">EMAIL: </span><span className="break-all">{user.email}</span></div>
                          <div><span className="text-payload-muted">JOINED: </span>{new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUnlockUser(user.id)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 font-mono text-xs border border-payload-neon text-payload-neon px-3 py-2 hover:bg-payload-neon hover:text-black"><Unlock className="w-3 h-3" />UNLOCK</button>
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 font-mono text-xs border border-red-500 text-red-500 px-3 py-2 hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" />DELETE</button>
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
