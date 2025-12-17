import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { LogOut, Rocket, Target, DollarSign, Building, MapPin, BookOpen, Shield, Megaphone, Pin, X } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';
import PayloadsModal from '@/components/modules/PayloadsModal';
import MissionsModal from '@/components/modules/MissionsModal';
import BankModal from '@/components/modules/BankModal';
import HeadquartersModal from '@/components/modules/HeadquartersModal';
import StationsModal from '@/components/modules/StationsModal';
import BasecampModal from '@/components/modules/BasecampModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_COLORS = {
  low: 'border-gray-500/30',
  normal: 'border-blue-500/30',
  high: 'border-orange-500/30',
  urgent: 'border-red-500/50 bg-red-500/5'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncements();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            {/* Logo */}
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
            
            {/* Nav Items */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
              {/* Commander info */}
              <div className="font-mono text-xs order-first sm:order-none">
                <span className="text-payload-muted uppercase tracking-widest">COMMANDER: </span>
                <span className="text-payload-neon">{user?.name}</span>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {user?.role === 'admin' && (
                  <button
                    data-testid="goto-admin-btn"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-payload-alert text-payload-alert px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-payload-alert hover:text-black transition-all duration-300"
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    ADMIN
                  </button>
                )}
                <button
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  LOGOUT
                </button>
              </div>
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
          <div className="mb-8 sm:mb-12">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">
              MISSION CONTROL
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-neon uppercase tracking-widest">
              {dashboardData?.status || 'SYSTEMS ONLINE'}
            </p>
          </div>

          {/* Announcements Section */}
          {visibleAnnouncements.length > 0 && (
            <div className="mb-6 sm:mb-8 space-y-3">
              {visibleAnnouncements.slice(0, 3).map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-payload-surface border ${PRIORITY_COLORS[announcement.priority]} p-3 sm:p-4 rounded-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      {announcement.is_pinned ? (
                        <Pin className="w-4 h-4 text-payload-alert flex-shrink-0 mt-0.5" />
                      ) : (
                        <Megaphone className="w-4 h-4 text-payload-cyan flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-rajdhani font-bold text-sm sm:text-base uppercase tracking-wide mb-1">
                          {announcement.title}
                        </h4>
                        <p className="font-inter text-xs sm:text-sm text-payload-muted line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="font-mono text-[10px] text-payload-muted mt-1">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="p-1 hover:bg-white/10 rounded-sm flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-payload-muted" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              data-testid="payloads-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setActiveModal('payloads')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-neon/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-payload-neon flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">ACTIVE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">PAYLOADS</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Active ventures & projects</p>
              <div className="font-mono text-2xl sm:text-3xl text-payload-neon">{dashboardData?.payloads_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="missions-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => setActiveModal('missions')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-cyan/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-payload-cyan flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">PROGRESS</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">MISSIONS</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Tasks and objectives</p>
              <div className="font-mono text-2xl sm:text-3xl text-payload-cyan">{dashboardData?.missions_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="bank-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setActiveModal('bank')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-payload-alert/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-payload-alert flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">BALANCE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">BANK</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Financial resources</p>
              <div className="font-mono text-xl sm:text-3xl text-payload-alert">${(dashboardData?.balance || 0).toFixed(2)}</div>
            </motion.div>

            <motion.div
              data-testid="headquarters-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setActiveModal('headquarters')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">ACTIVE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">HQ</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Main operations base</p>
              <div className="font-mono text-xs sm:text-sm text-white">{dashboardData?.headquarters ? 'SET' : 'NOT SET'}</div>
            </motion.div>

            <motion.div
              data-testid="stations-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveModal('stations')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">LINKED</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">STATIONS</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Locations & partnerships</p>
              <div className="font-mono text-2xl sm:text-3xl text-white">{dashboardData?.stations_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="basecamp-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setActiveModal('basecamp')}
              className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
                <span className="font-mono text-[8px] sm:text-xs text-payload-muted uppercase tracking-normal sm:tracking-widest text-right">READY</span>
              </div>
              <h3 className="font-rajdhani font-bold text-base sm:text-2xl uppercase tracking-wide mb-1 sm:mb-2">BASECAMP</h3>
              <p className="font-inter text-[11px] sm:text-sm text-payload-muted mb-3 sm:mb-4 line-clamp-2">Resources & training</p>
              <div className="font-mono text-xs sm:text-sm text-white">ACCESS</div>
            </motion.div>
          </div>

          <div className="mt-8 sm:mt-12 bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm">
            <h3 className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-payload-muted mb-3 sm:mb-4">SYSTEM STATUS</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm">
                <span className="text-payload-text">Member Since</span>
                <span className="text-payload-neon">{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm">
                <span className="text-payload-text">Access Level</span>
                <span className="text-payload-cyan uppercase">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs sm:text-sm">
                <span className="text-payload-text">Status</span>
                <span className="text-payload-neon uppercase">{user?.status}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {activeModal === 'payloads' && <PayloadsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'missions' && <MissionsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'bank' && <BankModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'headquarters' && <HeadquartersModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'stations' && <StationsModal onClose={() => setActiveModal(null)} onUpdate={refreshData} />}
      {activeModal === 'basecamp' && <BasecampModal onClose={() => setActiveModal(null)} />}
    </div>
  );
};

export default Dashboard;