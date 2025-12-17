import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Users, Rocket, Target, DollarSign, TrendingUp, Clock } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-payload-bg flex items-center justify-center">
        <div className="font-mono text-payload-neon animate-pulse">LOADING ANALYTICS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-rajdhani font-bold text-2xl tracking-widest text-payload-neon">
            PAYLOAD
          </div>
          <button
            data-testid="back-to-admin-btn"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 font-mono text-sm border border-white/20 px-4 py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO ADMIN
          </button>
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
              ANALYTICS DASHBOARD
            </h1>
            <p className="font-mono text-sm text-payload-alert uppercase tracking-widest">
              SYSTEM METRICS & INSIGHTS
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              data-testid="total-members-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <Users className="w-8 h-8 text-payload-neon" />
                <TrendingUp className="w-5 h-5 text-payload-muted" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2">TOTAL MEMBERS</h3>
              <div className="font-mono text-3xl text-payload-neon">{analytics?.total_members || 0}</div>
              <div className="font-mono text-xs text-payload-muted mt-2">
                {analytics?.approved_members || 0} approved
              </div>
            </motion.div>

            <motion.div
              data-testid="pending-members-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <Clock className="w-8 h-8 text-payload-alert" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2">PENDING APPROVAL</h3>
              <div className="font-mono text-3xl text-payload-alert">{analytics?.pending_members || 0}</div>
              <div className="font-mono text-xs text-payload-muted mt-2">
                awaiting review
              </div>
            </motion.div>

            <motion.div
              data-testid="payloads-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <Rocket className="w-8 h-8 text-payload-cyan" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2">TOTAL PAYLOADS</h3>
              <div className="font-mono text-3xl text-payload-cyan">{analytics?.total_payloads || 0}</div>
              <div className="font-mono text-xs text-payload-muted mt-2">
                {analytics?.active_payloads || 0} active
              </div>
            </motion.div>

            <motion.div
              data-testid="missions-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-payload-surface border border-white/10 p-6 rounded-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2">TOTAL MISSIONS</h3>
              <div className="font-mono text-3xl text-white">{analytics?.total_missions || 0}</div>
              <div className="font-mono text-xs text-payload-muted mt-2">
                {analytics?.completed_missions || 0} completed
              </div>
            </motion.div>
          </div>

          <div className="bg-payload-surface border border-white/10 p-6 rounded-sm mb-8">
            <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-6">PLATFORM ACTIVITY</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-l-2 border-payload-neon pl-4">
                <div className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-1">TRANSACTIONS</div>
                <div className="font-mono text-2xl text-payload-neon">{analytics?.total_transactions || 0}</div>
              </div>
              <div className="border-l-2 border-payload-cyan pl-4">
                <div className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-1">COMPLETION RATE</div>
                <div className="font-mono text-2xl text-payload-cyan">
                  {analytics?.total_missions > 0 
                    ? Math.round((analytics?.completed_missions / analytics?.total_missions) * 100)
                    : 0}%
                </div>
              </div>
              <div className="border-l-2 border-payload-alert pl-4">
                <div className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-1">ACTIVE RATE</div>
                <div className="font-mono text-2xl text-payload-alert">
                  {analytics?.total_payloads > 0 
                    ? Math.round((analytics?.active_payloads / analytics?.total_payloads) * 100)
                    : 0}%
                </div>
              </div>
            </div>
          </div>

          {analytics?.recent_members && analytics.recent_members.length > 0 && (
            <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
              <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-6">RECENT MEMBERS</h3>
              <div className="space-y-3">
                {analytics.recent_members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    data-testid={`recent-member-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between border-b border-white/5 pb-3"
                  >
                    <div>
                      <div className="font-mono text-sm text-payload-text">{member.name}</div>
                      <div className="font-mono text-xs text-payload-muted">{member.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-payload-muted">
                        {new Date(member.created_at).toLocaleDateString()}
                      </div>
                      <div className={`font-mono text-xs uppercase tracking-widest ${
                        member.status === 'approved' ? 'text-payload-neon' : 
                        member.status === 'pending' ? 'text-payload-alert' : 'text-red-500'
                      }`}>
                        {member.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;