import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { LogOut, Rocket, Target, DollarSign, Building, Users, BookOpen, Shield, Megaphone, Pin, X, Gift, CreditCard, Award, Briefcase, TrendingUp, Building2 } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';
import SettingsDropdown from '@/components/SettingsDropdown';
import PayloadsModal from '@/components/modules/PayloadsModal';
import MissionsModal from '@/components/modules/MissionsModal';
import MemberProjectsModal from '@/components/modules/MemberProjectsModal';
import MemberMissionsModal from '@/components/modules/MemberMissionsModal';
import BankModal from '@/components/modules/BankModal';
import StationsModal from '@/components/modules/StationsModal';
import ClusterSyndicateModal from '@/components/modules/ClusterSyndicateModal';
import BasecampModal from '@/components/modules/BasecampModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_COLORS = {
  low: 'border-gray-500/30',
  normal: 'border-blue-500/30',
  high: 'border-orange-500/30',
  urgent: 'border-red-500/50 bg-red-500/5'
};

const TIER_CONFIG = {
  junior_recruit: { label: 'JUNIOR RECRUIT', icon: '📝' },
  front_line: { label: 'FRONT-LINE', icon: '🕵️' },
  mid_level_manager: { label: 'MID-LEVEL MGR', icon: '📊' },
  senior_manager: { label: 'SENIOR MGR', icon: '🎯' },
  top_leadership: { label: 'TOP LEADER', icon: '👑' }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [clusterData, setClusterData] = useState({ clusters: [], total_capital: 0 });
  const [bankTotal, setBankTotal] = useState(0);
  const [fundingSummary, setFundingSummary] = useState({ total_members: 0, registered_count: 0, funded_count: 0 });

  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncements();
    fetchProfile();
    fetchClusterData();
    fetchBankTotal();
    if (user?.role === 'admin') {
      fetchFundingSummary();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      if (user?.role === 'member' && !response.data.onboarding_complete) {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchClusterData = async () => {
    try {
      const response = await axios.get(`${API}/funding/cluster/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClusterData(response.data);
    } catch (error) {
      console.error('Failed to fetch cluster data:', error);
    }
  };

  const fetchBankTotal = async () => {
    try {
      const response = await axios.get(`${API}/funding/bank/total`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBankTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch bank total:', error);
    }
  };

  const fetchFundingSummary = async () => {
    try {
      const response = await axios.get(`${API}/funding/progress/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFundingSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch funding summary:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const dismissAnnouncement = async (id) => {
    setDismissedAnnouncements([...dismissedAnnouncements, id]);
    try {
      await axios.post(`${API}/announcements/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo - Left */}
            <button
              data-testid="logo-home-btn"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-lg sm:text-2xl tracking-widest text-payload-neon">
                PAYLOAD
              </div>
            </button>
            
            {/* Right side - Admin, Settings, Logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Commander info - hidden on mobile */}
              <div className="hidden sm:block font-mono text-xs">
                <span className="text-payload-muted uppercase tracking-widest">AGENT: </span>
                <span className="text-payload-neon">{user?.name}</span>
              </div>
              
              {user?.role === 'admin' && (
                <button
                  data-testid="goto-admin-btn"
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1 sm:gap-2 font-mono text-xs border border-payload-alert text-payload-alert px-2 sm:px-3 py-1.5 hover:bg-payload-alert hover:text-black transition-all"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">ADMIN</span>
                </button>
              )}
              <SettingsDropdown />
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 font-mono text-xs border border-white/20 px-2 sm:px-3 py-1.5 hover:border-white hover:bg-white/5 transition-all"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">MISSION CONTROL</h1>
                <p className="font-mono text-xs sm:text-sm text-payload-neon uppercase tracking-widest">{dashboardData?.status || 'SYSTEMS ONLINE'}</p>
              </div>
              <div className="flex flex-row items-center gap-2 sm:gap-3">
                {/* Member Tier Badge */}
                {user?.role === 'member' && profile?.tier && (
                  <div className="bg-black border border-amber-500 sm:border-2 rounded-sm px-2 py-1 sm:px-4 sm:py-2 shadow-[0_0_10px_rgba(245,158,11,0.2)] sm:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Award className="w-3 h-3 sm:w-5 sm:h-5 text-amber-500" />
                      <div>
                        <div className="font-mono text-[8px] sm:text-[10px] text-payload-muted uppercase">TIER</div>
                        <div className="font-mono text-xs sm:text-xl text-amber-500 font-bold">
                          {TIER_CONFIG[profile.tier]?.icon} {TIER_CONFIG[profile.tier]?.label || 'RECRUIT'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Credit Score Badge */}
                {profile?.credit_score && (
                  <div className="bg-black border border-payload-neon sm:border-2 rounded-sm px-2 py-1 sm:px-4 sm:py-2 shadow-[0_0_10px_rgba(0,255,170,0.2)] sm:shadow-[0_0_15px_rgba(0,255,170,0.3)]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <CreditCard className="w-3 h-3 sm:w-5 sm:h-5 text-payload-neon" />
                      <div>
                        <div className="font-mono text-[8px] sm:text-[10px] text-payload-muted uppercase">CREDIT</div>
                        <div className="font-mono text-xs sm:text-2xl text-payload-neon font-bold">{profile.credit_score}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {visibleAnnouncements.length > 0 && (
            <div className="mb-6 sm:mb-8 space-y-3">
              {visibleAnnouncements.slice(0, 3).map((announcement) => (
                <motion.div key={announcement.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`bg-payload-surface border ${PRIORITY_COLORS[announcement.priority]} p-3 sm:p-4 rounded-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      {announcement.is_pinned ? <Pin className="w-4 h-4 text-payload-alert flex-shrink-0 mt-0.5" /> : <Megaphone className="w-4 h-4 text-payload-cyan flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-rajdhani font-bold text-sm sm:text-base uppercase tracking-wide mb-1">{announcement.title}</h4>
                        <p className="font-inter text-xs sm:text-sm text-payload-muted line-clamp-2">{announcement.content}</p>
                        <p className="font-mono text-[10px] text-payload-muted mt-1">{new Date(announcement.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => dismissAnnouncement(announcement.id)} className="p-1 hover:bg-white/10 rounded-sm flex-shrink-0"><X className="w-4 h-4 text-payload-muted" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Work Zone Card - Prominent at top */}
          <motion.div 
            data-testid="workzone-card"
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }}
            onClick={() => navigate('/workzone')} 
            className="mb-6 bg-gradient-to-r from-payload-surface via-payload-surface to-black border-2 border-payload-alert/50 p-5 sm:p-6 rounded-sm hover:border-payload-alert hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-payload-alert/20 rounded-sm flex items-center justify-center">
                  <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-payload-alert" />
                </div>
                <div>
                  <h3 className="font-rajdhani font-bold text-xl sm:text-2xl uppercase text-payload-alert">WORK ZONE</h3>
                  {user?.role === 'member' ? (
                    <p className="font-mono text-xs text-payload-muted mt-1">REQUEST ACCESS TO WORK ZONE</p>
                  ) : (
                    <p className="font-mono text-xs text-payload-muted mt-1">MANAGE COLLABORATIVE WORKSPACE</p>
                  )}
                </div>
              </div>
              <div className="font-mono text-xs sm:text-sm text-payload-alert uppercase">
                ENTER →
              </div>
            </div>
          </motion.div>

          {/* Guaranteed Flips Card - Prominent at top */}
          <motion.div 
            data-testid="guaranteed-flips-card"
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/guaranteed-flips')} 
            className="mb-6 bg-gradient-to-r from-payload-surface via-payload-surface to-black border-2 border-payload-neon/50 p-5 sm:p-6 rounded-sm hover:border-payload-neon hover:shadow-[0_0_20px_rgba(0,255,170,0.2)] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-payload-neon/20 rounded-sm flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-payload-neon" />
                </div>
                <div>
                  <h3 className="font-rajdhani font-bold text-xl sm:text-2xl uppercase text-payload-neon">GUARANTEED FLIPS</h3>
                  <p className="font-mono text-xs text-payload-muted mt-1">EXCLUSIVE INVESTMENT OPPORTUNITIES</p>
                </div>
              </div>
              <div className="font-mono text-xs sm:text-sm text-payload-neon uppercase">
                ENTER →
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div data-testid="headquarters-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} onClick={() => navigate('/headquarters')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">8 ROOMS</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">HQ</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Business Operations</p>
              <div className="font-mono text-xs sm:text-sm text-white">VIEW ROOMS</div>
            </motion.div>

            <motion.div data-testid="payloads-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onClick={() => setActiveModal('payloads')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-neon/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-payload-neon" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">ACTIVE</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">PAYLOADS</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Ventures & projects</p>
              <div className="font-mono text-xl sm:text-2xl text-payload-neon">{dashboardData?.payloads_count || 0}</div>
            </motion.div>

            <motion.div data-testid="missions-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onClick={() => setActiveModal('missions')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-cyan/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><Target className="w-6 h-6 sm:w-8 sm:h-8 text-payload-cyan" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">PROGRESS</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">MISSIONS</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Tasks & objectives</p>
              <div className="font-mono text-xl sm:text-2xl text-payload-cyan">{dashboardData?.missions_count || 0}</div>
            </motion.div>

            <motion.div data-testid="bank-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} onClick={() => setActiveModal('bank')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-alert/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-payload-alert" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">BALANCE</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">BANK</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Financial resources</p>
              <div className="font-mono text-lg sm:text-2xl text-payload-alert">${(dashboardData?.balance || 0).toFixed(2)}</div>
            </motion.div>

            <motion.div data-testid="stations-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={() => setActiveModal('stations')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">MEMBERS</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">CLUSTER SYNDICATE</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Members in same business</p>
              <div className="font-mono text-xl sm:text-2xl text-white">{dashboardData?.stations_count || 0}</div>
            </motion.div>

            <motion.div data-testid="basecamp-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} onClick={() => setActiveModal('basecamp')} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3"><BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" /><span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase">READY</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">BASECAMP</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Resources & training</p>
              <div className="font-mono text-xs sm:text-sm text-white">ACCESS</div>
            </motion.div>

            <motion.div data-testid="referrals-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} onClick={() => navigate('/referrals')} className="bg-payload-surface border border-purple-500/30 p-4 sm:p-6 rounded-sm hover:border-purple-500/50 transition-all cursor-pointer col-span-2 lg:col-span-3">
              <div className="flex items-start justify-between gap-2 mb-3"><Gift className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" /><span className="font-mono text-[8px] sm:text-xs text-purple-400 uppercase">GROW</span></div>
              <h3 className="font-rajdhani font-bold text-base sm:text-xl uppercase mb-1">CENSORED REFERRALS</h3>
              <p className="font-inter text-[10px] sm:text-xs text-payload-muted mb-2">Track referrals & boost your tier</p>
              <div className="font-mono text-xs sm:text-sm text-purple-400">VIEW REFERRALS</div>
            </motion.div>
          </div>

          <div className="mt-8 sm:mt-12 bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm">
            <h3 className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-payload-muted mb-3">SYSTEM STATUS</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm"><span className="text-payload-text">Member Since</span><span className="text-payload-neon">{new Date(user?.created_at).toLocaleDateString()}</span></div>
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm"><span className="text-payload-text">Access Level</span><span className="text-payload-cyan uppercase">{user?.role}</span></div>
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm"><span className="text-payload-text">Status</span><span className="text-payload-neon uppercase">{user?.status}</span></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Use MemberProjectsModal for members, PayloadsModal for admin */}
      {activeModal === 'payloads' && (
        user?.role === 'admin' 
          ? <PayloadsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />
          : <MemberProjectsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />
      )}
      {activeModal === 'missions' && (
        user?.role === 'admin'
          ? <MissionsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />
          : <MemberProjectsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />
      )}
      {activeModal === 'bank' && <BankModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'stations' && <StationsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'basecamp' && <BasecampModal onClose={() => setActiveModal(null)} />}
    </div>
  );
};

export default Dashboard;
