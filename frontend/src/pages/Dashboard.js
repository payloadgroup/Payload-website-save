import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { LogOut, Settings, Rocket, Target, DollarSign, Building, MapPin, BookOpen, Shield, Plus } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';
import PayloadsModal from '@/components/modules/PayloadsModal';
import MissionsModal from '@/components/modules/MissionsModal';
import BankModal from '@/components/modules/BankModal';
import HeadquartersModal from '@/components/modules/HeadquartersModal';
import StationsModal from '@/components/modules/StationsModal';
import BasecampModal from '@/components/modules/BasecampModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <PayloadLogo size="default" />
            <div className="font-rajdhani font-bold text-2xl tracking-widest text-payload-neon">
              PAYLOAD
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="font-mono text-xs">
              <span className="text-payload-muted uppercase tracking-widest">COMMANDER: </span>
              <span className="text-payload-neon">{user?.name}</span>
            </div>
            {user?.role === 'admin' && (
              <button
                data-testid="goto-admin-btn"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 font-mono text-sm border border-payload-alert text-payload-alert px-4 py-2 rounded-none hover:bg-payload-alert hover:text-black transition-all duration-300"
              >
                <Shield className="w-4 h-4" />
                ADMIN
              </button>
            )}
            <button
              data-testid="settings-btn"
              className="p-2 hover:bg-white/5 rounded-none border border-transparent hover:border-white/20 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 font-mono text-sm border border-white/20 px-4 py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT
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
          <div className="mb-12">
            <h1 className="font-rajdhani font-bold text-4xl uppercase tracking-wide mb-2">
              MISSION CONTROL
            </h1>
            <p className="font-mono text-sm text-payload-neon uppercase tracking-widest">
              {dashboardData?.status || 'SYSTEMS ONLINE'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              data-testid="payloads-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setActiveModal('payloads')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-payload-neon/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <Rocket className="w-8 h-8 text-payload-neon" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">ACTIVE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">PAYLOADS</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Active business ventures and projects</p>
              <div className="font-mono text-3xl text-payload-neon">{dashboardData?.payloads_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="missions-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => setActiveModal('missions')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-payload-cyan/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <Target className="w-8 h-8 text-payload-cyan" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">IN PROGRESS</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">MISSIONS</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Current tasks and objectives</p>
              <div className="font-mono text-3xl text-payload-cyan">{dashboardData?.missions_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="bank-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setActiveModal('bank')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-payload-alert/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <DollarSign className="w-8 h-8 text-payload-alert" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">BALANCE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">BUSINESS BANK</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Financial resources</p>
              <div className="font-mono text-3xl text-payload-alert">${(dashboardData?.balance || 0).toFixed(2)}</div>
            </motion.div>

            <motion.div
              data-testid="headquarters-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setActiveModal('headquarters')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <Building className="w-8 h-8 text-white" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">OPERATIONAL</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">HEADQUARTERS</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Main operations base</p>
              <div className="font-mono text-sm text-white">{dashboardData?.headquarters ? 'SET' : 'NOT SET'}</div>
            </motion.div>

            <motion.div
              data-testid="stations-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveModal('stations')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <MapPin className="w-8 h-8 text-white" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">LINKED</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">STATIONS</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Active locations and partnerships</p>
              <div className="font-mono text-3xl text-white">{dashboardData?.stations_count || 0}</div>
            </motion.div>

            <motion.div
              data-testid="basecamp-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setActiveModal('basecamp')}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <BookOpen className="w-8 h-8 text-white" />
                <span className="font-mono text-xs text-payload-muted uppercase tracking-widest">AVAILABLE</span>
              </div>
              <h3 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2">BASECAMP</h3>
              <p className="font-inter text-sm text-payload-muted mb-4">Resources and training materials</p>
              <div className="font-mono text-sm text-white">ACCESS</div>
            </motion.div>
          </div>

          <div className="mt-12 bg-payload-surface border border-white/10 p-6 rounded-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">SYSTEM STATUS</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-payload-text">Member Since</span>
                <span className="text-payload-neon">{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-payload-text">Access Level</span>
                <span className="text-payload-cyan uppercase">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-sm">
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