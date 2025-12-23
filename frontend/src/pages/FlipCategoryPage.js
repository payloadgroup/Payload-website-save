import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Building, Briefcase, Star, ArrowRightLeft, Shield, 
  Plus, Edit, Trash2, X, Users, Check, Phone, PhoneOff, 
  ChevronDown, ChevronUp, DollarSign, Calendar, TrendingUp,
  MessageSquare, Send, User as UserIcon
} from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTION_CONFIG = {
  property: {
    title: 'Property Deals / Opportunity',
    icon: Building,
    color: 'payload-cyan',
    bgColor: 'bg-payload-cyan/10',
    borderColor: 'border-payload-cyan/30'
  },
  business: {
    title: 'Business Deals / Opportunity',
    icon: Briefcase,
    color: 'payload-neon',
    bgColor: 'bg-payload-neon/10',
    borderColor: 'border-payload-neon/30'
  },
  unique: {
    title: 'Uniquely Positioned Deals',
    icon: Star,
    color: 'purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30'
  },
  arbitrage: {
    title: 'Arbitrage Opportunity',
    icon: ArrowRightLeft,
    color: 'payload-alert',
    bgColor: 'bg-payload-alert/10',
    borderColor: 'border-payload-alert/30'
  },
  top_secret: {
    title: 'Top Secret - 100% Guaranteed ROI',
    icon: Shield,
    color: 'red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
};

const FlipCategoryPage = () => {
  const navigate = useNavigate();
  const { section } = useParams();
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlay, setEditingPlay] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_investment: '',
    expected_return: '',
    deadline: '',
    is_active: true
  });
  
  // Participant modal state
  const [selectedPlay, setSelectedPlay] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Member join status
  const [joinStatus, setJoinStatus] = useState({});
  
  // Crypto submission state (for Arbitrage)
  const [cryptoFormOpen, setCryptoFormOpen] = useState({});
  const [cryptoSubmissionStatus, setCryptoSubmissionStatus] = useState({});
  const [cryptoFormData, setCryptoFormData] = useState({});
  const [submittingCrypto, setSubmittingCrypto] = useState(null);
  const [cryptoSubmissionCounts, setCryptoSubmissionCounts] = useState({});
  
  // Admin: Crypto submissions modal
  const [cryptoSubmissionsModal, setCryptoSubmissionsModal] = useState(null);
  const [cryptoSubmissions, setCryptoSubmissions] = useState([]);
  const [loadingCryptoSubmissions, setLoadingCryptoSubmissions] = useState(false);

  const config = SECTION_CONFIG[section] || SECTION_CONFIG.property;
  const IconComponent = config.icon;

  useEffect(() => {
    if (section) {
      fetchPlays();
    }
  }, [section]);

  const fetchPlays = async () => {
    try {
      const res = await axios.get(`${API}/flips/plays/${section}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlays(res.data);
      
      // Fetch join status for each play (for members)
      if (!isAdmin) {
        const statusPromises = res.data.map(async (play) => {
          try {
            const statusRes = await axios.get(`${API}/flips/plays/${play.id}/my-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return { playId: play.id, joined: statusRes.data.joined };
          } catch {
            return { playId: play.id, joined: false };
          }
        });
        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(s => { statusMap[s.playId] = s.joined; });
        setJoinStatus(statusMap);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You don't have access to this section");
        navigate('/guaranteed-flips');
      } else {
        console.error('Failed to fetch plays:', error);
        toast.error('Failed to load plays');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlay = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        section,
        min_investment: formData.min_investment ? parseFloat(formData.min_investment) : null,
        deadline: formData.deadline || null
      };

      if (editingPlay) {
        await axios.put(`${API}/flips/plays/${editingPlay.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Play updated');
      } else {
        await axios.post(`${API}/flips/plays`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Play created');
      }
      
      setShowForm(false);
      setEditingPlay(null);
      resetForm();
      fetchPlays();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save play');
    }
  };

  const handleEditPlay = (play) => {
    setFormData({
      title: play.title,
      description: play.description,
      min_investment: play.min_investment || '',
      expected_return: play.expected_return || '',
      deadline: play.deadline || '',
      is_active: play.is_active
    });
    setEditingPlay(play);
    setShowForm(true);
  };

  const handleDeletePlay = async (playId) => {
    if (!window.confirm('Are you sure you want to delete this play?')) return;
    
    try {
      await axios.delete(`${API}/flips/plays/${playId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Play deleted');
      fetchPlays();
    } catch (error) {
      toast.error('Failed to delete play');
    }
  };

  const handleJoinPlay = async (playId) => {
    try {
      const res = await axios.post(`${API}/flips/plays/${playId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      setJoinStatus(prev => ({ ...prev, [playId]: true }));
      fetchPlays();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join play');
    }
  };

  const handleViewParticipants = async (play) => {
    setSelectedPlay(play);
    setLoadingParticipants(true);
    try {
      const res = await axios.get(`${API}/flips/plays/${play.id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(res.data);
    } catch (error) {
      toast.error('Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleUpdateContactStatus = async (userId, status) => {
    try {
      await axios.put(
        `${API}/flips/plays/${selectedPlay.id}/participants/${userId}/contact-status`,
        { contact_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      // Refresh participants
      const res = await axios.get(`${API}/flips/plays/${selectedPlay.id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(res.data);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      min_investment: '',
      expected_return: '',
      deadline: '',
      is_active: true
    });
  };

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
              onClick={() => navigate('/guaranteed-flips')} 
              className="flex items-center gap-2 font-mono text-xs sm:text-sm border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" /> BACK
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className={`mb-8 p-6 rounded-sm ${config.bgColor} border ${config.borderColor}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-sm flex items-center justify-center bg-${config.color}/20`}>
                <IconComponent className={`w-8 h-8 text-${config.color}`} />
              </div>
              <div>
                <h1 className={`font-rajdhani font-bold text-2xl sm:text-3xl uppercase tracking-wide text-${config.color}`}>
                  {config.title}
                </h1>
                <p className="font-mono text-xs text-payload-muted mt-1">
                  {plays.length} ACTIVE PLAY{plays.length !== 1 ? 'S' : ''} AVAILABLE
                </p>
              </div>
            </div>
          </div>

          {/* Admin: Add Play Button */}
          {isAdmin && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-payload-neon text-payload-neon py-3 hover:bg-payload-neon/10 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> ADD NEW PLAY
            </button>
          )}

          {/* Admin: Play Form */}
          {isAdmin && showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-payload-surface border border-white/20 p-6 rounded-sm mb-6"
            >
              <h3 className="font-rajdhani font-bold text-xl mb-4 uppercase">
                {editingPlay ? 'EDIT PLAY' : 'NEW PLAY'}
              </h3>
              <form onSubmit={handleSubmitPlay} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                />
                <textarea
                  required
                  placeholder="Description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Min Investment ($)"
                    value={formData.min_investment}
                    onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                    className="bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Expected Return (e.g., 20%)"
                    value={formData.expected_return}
                    onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                    className="bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                  />
                  <input
                    type="date"
                    placeholder="Deadline"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-mono text-sm">Active</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-payload-neon text-black font-mono text-sm py-2 hover:bg-payload-neon/80"
                  >
                    {editingPlay ? 'UPDATE' : 'CREATE'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingPlay(null); resetForm(); }}
                    className="flex-1 border border-white/20 font-mono text-sm py-2 hover:bg-white/10"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Plays List */}
          {loading ? (
            <div className="text-center py-12 font-mono text-payload-muted">LOADING...</div>
          ) : plays.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-payload-muted opacity-30" />
              <p className="font-mono text-payload-muted">NO PLAYS AVAILABLE YET</p>
              {isAdmin && (
                <p className="font-mono text-xs text-payload-muted mt-2">Add a play to get started</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {plays.map((play) => (
                <motion.div
                  key={play.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-payload-surface border ${config.borderColor} rounded-sm overflow-hidden ${!play.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-rajdhani font-bold text-xl uppercase text-${config.color}`}>
                            {play.title}
                          </h3>
                          {!play.is_active && (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-sm">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <p className="font-inter text-sm text-payload-muted mb-4">{play.description}</p>
                        
                        {/* Play Details */}
                        <div className="flex flex-wrap gap-4 mb-4">
                          {play.min_investment && (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <DollarSign className="w-3 h-3 text-payload-alert" />
                              <span className="text-payload-muted">MIN:</span>
                              <span className="text-white">${play.min_investment.toLocaleString()}</span>
                            </div>
                          )}
                          {play.expected_return && (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <TrendingUp className="w-3 h-3 text-payload-neon" />
                              <span className="text-payload-muted">RETURN:</span>
                              <span className="text-payload-neon">{play.expected_return}</span>
                            </div>
                          )}
                          {play.deadline && (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <Calendar className="w-3 h-3 text-payload-cyan" />
                              <span className="text-payload-muted">DEADLINE:</span>
                              <span className="text-white">{new Date(play.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Participant Count (Admin clickable) */}
                        {isAdmin ? (
                          <button
                            onClick={() => handleViewParticipants(play)}
                            className="flex items-center gap-2 font-mono text-xs bg-white/10 px-3 py-1.5 rounded-sm hover:bg-white/20 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span>{play.participant_count} MEMBER{play.participant_count !== 1 ? 'S' : ''}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 font-mono text-xs text-payload-muted">
                            <Users className="w-4 h-4" />
                            <span>{play.participant_count} member{play.participant_count !== 1 ? 's' : ''} participating</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleEditPlay(play)}
                              className="p-2 border border-white/20 hover:bg-white/10"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlay(play.id)}
                              className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleJoinPlay(play.id)}
                            disabled={joinStatus[play.id]}
                            className={`flex items-center gap-2 font-mono text-sm px-4 py-2 ${
                              joinStatus[play.id]
                                ? 'bg-green-500/20 text-green-400 cursor-default'
                                : `bg-${config.color} text-black hover:opacity-80`
                            }`}
                          >
                            {joinStatus[play.id] ? (
                              <>
                                <Check className="w-4 h-4" /> JOINED
                              </>
                            ) : (
                              'JOIN'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Participants Modal (Admin) */}
      <AnimatePresence>
        {selectedPlay && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => { setSelectedPlay(null); setSelectedMember(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="border-b border-white/10 p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-rajdhani font-bold text-xl uppercase">PARTICIPANTS</h2>
                  <p className="font-mono text-xs text-payload-muted">{selectedPlay.title}</p>
                </div>
                <button
                  onClick={() => { setSelectedPlay(null); setSelectedMember(null); }}
                  className="p-2 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {loadingParticipants ? (
                  <div className="text-center py-8 font-mono text-payload-muted">LOADING...</div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-payload-muted opacity-30" />
                    <p className="font-mono text-payload-muted">NO PARTICIPANTS YET</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.id} className="bg-black/30 border border-white/10 rounded-sm overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-white/5"
                          onClick={() => setSelectedMember(selectedMember === participant.user_id ? null : participant.user_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-rajdhani font-bold">
                                {participant.user_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-rajdhani font-bold">{participant.user_name}</div>
                                <div className="font-mono text-xs text-payload-muted">{participant.user_email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={participant.contact_status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateContactStatus(participant.user_id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`bg-black border px-3 py-1.5 font-mono text-xs rounded-sm ${
                                  participant.contact_status === 'contacted' 
                                    ? 'border-green-500/50 text-green-400' 
                                    : 'border-white/20 text-payload-muted'
                                }`}
                              >
                                <option value="not_contacted">Not Contacted</option>
                                <option value="contacted">Contacted</option>
                              </select>
                              {selectedMember === participant.user_id ? (
                                <ChevronUp className="w-5 h-5 text-payload-muted" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-payload-muted" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Member Details */}
                        <AnimatePresence>
                          {selectedMember === participant.user_id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/10"
                            >
                              <div className="p-4 bg-black/20 grid grid-cols-2 gap-4">
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">NAME</div>
                                  <div className="font-mono text-sm">{participant.user_name}</div>
                                </div>
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">EMAIL</div>
                                  <div className="font-mono text-sm">{participant.user_email}</div>
                                </div>
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">MOBILE</div>
                                  <div className="font-mono text-sm">{participant.user_mobile || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">GMAIL ACCOUNT</div>
                                  <div className="font-mono text-sm">{participant.gmail_account || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">TIER</div>
                                  <div className="font-mono text-sm uppercase text-payload-neon">{participant.user_tier?.replace('_', ' ') || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-mono text-[10px] text-payload-muted uppercase mb-1">JOINED AT</div>
                                  <div className="font-mono text-sm">{new Date(participant.joined_at).toLocaleString()}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlipCategoryPage;
