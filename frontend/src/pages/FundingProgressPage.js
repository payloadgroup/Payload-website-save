import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Building2, DollarSign, CheckCircle, Circle, 
  Search, Filter, Users
} from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FundingProgressPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_members: 0, registered_count: 0, funded_count: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, not_registered, registered, funded
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, summaryRes] = await Promise.all([
        axios.get(`${API}/funding/progress/members`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/funding/progress/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMembers(membersRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch funding data:', error);
      toast.error('Failed to load funding data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, field, value) => {
    setUpdating(`${userId}-${field}`);
    try {
      await axios.put(
        `${API}/funding/progress/${userId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      await fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterStatus) {
      case 'not_registered':
        return !member.business_registered;
      case 'registered':
        return member.business_registered && !member.business_funded;
      case 'funded':
        return member.business_funded;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      {/* Navigation */}
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80">
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">PAYLOAD</div>
            </button>
            <button 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 font-mono text-xs sm:text-sm border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" /> ADMIN
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-payload-cyan" />
              FUNDING PROGRESS
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-muted">
              Track member business registration and funding status
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-payload-surface border border-white/10 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-payload-muted" />
                <span className="font-mono text-xs text-payload-muted">TOTAL MEMBERS</span>
              </div>
              <div className="font-rajdhani font-bold text-3xl text-white">{summary.total_members}</div>
            </div>
            <div className="bg-payload-surface border border-payload-alert/30 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-payload-alert" />
                <span className="font-mono text-xs text-payload-muted">REGISTERED</span>
              </div>
              <div className="font-rajdhani font-bold text-3xl text-payload-alert">{summary.registered_count}</div>
            </div>
            <div className="bg-payload-surface border border-payload-neon/30 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-payload-neon" />
                <span className="font-mono text-xs text-payload-muted">FUNDED</span>
              </div>
              <div className="font-rajdhani font-bold text-3xl text-payload-neon">{summary.funded_count}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-payload-muted" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-payload-surface border border-white/20 pl-10 pr-4 py-2 font-mono text-sm focus:border-payload-neon outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-payload-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-payload-surface border border-white/20 px-4 py-2 font-mono text-sm focus:border-payload-neon outline-none"
              >
                <option value="all">All Members</option>
                <option value="not_registered">Not Registered</option>
                <option value="registered">Registered (Not Funded)</option>
                <option value="funded">Funded</option>
              </select>
            </div>
          </div>

          {/* Members List */}
          {loading ? (
            <div className="text-center py-12 font-mono text-payload-muted">LOADING...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-payload-muted opacity-30" />
              <p className="font-mono text-payload-muted">NO MEMBERS FOUND</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="bg-payload-surface border border-white/10 p-4 rounded-sm hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-rajdhani font-bold text-lg">{member.user_name}</h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-white/10 text-payload-muted uppercase rounded-sm">
                          {member.tier?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-payload-muted">{member.user_email}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Business Registered */}
                      <button
                        onClick={() => handleUpdateStatus(member.user_id, 'business_registered', !member.business_registered)}
                        disabled={updating === `${member.user_id}-business_registered`}
                        className={`flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all ${
                          member.business_registered
                            ? 'bg-payload-alert/20 border border-payload-alert/50 text-payload-alert'
                            : 'bg-black/30 border border-white/10 text-payload-muted hover:border-white/30'
                        }`}
                      >
                        {member.business_registered ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        REGISTERED
                      </button>
                      
                      {/* Business Funded */}
                      <button
                        onClick={() => handleUpdateStatus(member.user_id, 'business_funded', !member.business_funded)}
                        disabled={updating === `${member.user_id}-business_funded`}
                        className={`flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all ${
                          member.business_funded
                            ? 'bg-payload-neon/20 border border-payload-neon/50 text-payload-neon'
                            : 'bg-black/30 border border-white/10 text-payload-muted hover:border-white/30'
                        }`}
                      >
                        {member.business_funded ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        FUNDED
                      </button>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  {(member.registered_at || member.funded_at) && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                      {member.registered_at && (
                        <span className="font-mono text-[10px] text-payload-muted">
                          Registered: {new Date(member.registered_at).toLocaleDateString()}
                        </span>
                      )}
                      {member.funded_at && (
                        <span className="font-mono text-[10px] text-payload-neon">
                          Funded: {new Date(member.funded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FundingProgressPage;
