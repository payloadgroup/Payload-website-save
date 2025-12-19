import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Users, Megaphone, Activity, Gift, Crown, Plus, Edit, Trash2, Pin, PinOff, Eye, Clock, TrendingUp, AlertCircle, Copy, Check } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_CONFIG = {
  junior_recruit: { label: 'JUNIOR RECRUIT', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📝' },
  front_line: { label: 'FRONT-LINE', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '🕵️' },
  mid_level_manager: { label: 'MID-LEVEL MGR', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '📊' },
  senior_manager: { label: 'SENIOR MGR', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🎯' },
  top_leadership: { label: 'TOP LEADERSHIP', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '👑' }
};

const PRIORITY_CONFIG = {
  low: { label: 'LOW', color: 'text-gray-400' },
  normal: { label: 'NORMAL', color: 'text-blue-400' },
  high: { label: 'HIGH', color: 'text-orange-400' },
  urgent: { label: 'URGENT', color: 'text-red-500' }
};

const AdminManagement = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('tiers');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal', is_pinned: false, target_tiers: null });
  const [activityStats, setActivityStats] = useState(null);
  const [inactiveMembers, setInactiveMembers] = useState([]);
  const [referralStats, setReferralStats] = useState(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tiers') await fetchMembers();
      else if (activeTab === 'announcements') await fetchAnnouncements();
      else if (activeTab === 'activity') await fetchActivityStats();
      else if (activeTab === 'referrals') await fetchReferralStats();
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const fetchMembers = async () => { const r = await axios.get(`${API}/admin/members`, { headers: { Authorization: `Bearer ${token}` } }); setMembers(r.data); };
  const fetchAnnouncements = async () => { const r = await axios.get(`${API}/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } }); setAnnouncements(r.data); };
  const fetchActivityStats = async () => {
    const [s, i] = await Promise.all([axios.get(`${API}/admin/activity-stats`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API}/admin/inactive-members?days=30`, { headers: { Authorization: `Bearer ${token}` } })]);
    setActivityStats(s.data); setInactiveMembers(i.data);
  };
  const fetchReferralStats = async () => { const r = await axios.get(`${API}/admin/referral-stats`, { headers: { Authorization: `Bearer ${token}` } }); setReferralStats(r.data); };

  const handleTierChange = async (userId, newTier) => {
    try { await axios.post(`${API}/admin/update-tier`, { user_id: userId, tier: newTier }, { headers: { Authorization: `Bearer ${token}` } }); toast.success(`Tier updated`); fetchMembers(); }
    catch (error) { toast.error('Failed'); }
  };

  const handleCreateAnnouncement = async () => {
    try {
      if (editingAnnouncement) await axios.put(`${API}/admin/announcements/${editingAnnouncement.id}`, announcementForm, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.post(`${API}/admin/announcements`, announcementForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(editingAnnouncement ? 'Updated' : 'Created');
      setShowAnnouncementForm(false); setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', priority: 'normal', is_pinned: false, target_tiers: null }); fetchAnnouncements();
    } catch (error) { toast.error('Failed'); }
  };

  const handleDeleteAnnouncement = async (id) => { if (!window.confirm('Delete?')) return; try { await axios.delete(`${API}/admin/announcements/${id}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Deleted'); fetchAnnouncements(); } catch (error) { toast.error('Failed'); } };
  const handleTogglePin = async (a) => { try { await axios.put(`${API}/admin/announcements/${a.id}`, { is_pinned: !a.is_pinned }, { headers: { Authorization: `Bearer ${token}` } }); fetchAnnouncements(); } catch (error) { toast.error('Failed'); } };
  const handleToggleActive = async (a) => { try { await axios.put(`${API}/admin/announcements/${a.id}`, { is_active: !a.is_active }, { headers: { Authorization: `Bearer ${token}` } }); fetchAnnouncements(); } catch (error) { toast.error('Failed'); } };
  const copyToClipboard = (t) => { navigator.clipboard.writeText(t); toast.success('Copied'); };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 sm:gap-3 hover:opacity-80"><PayloadLogo size="default" /><div className="font-rajdhani font-bold text-lg sm:text-2xl tracking-widest text-payload-neon">PAYLOAD</div></button>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-1 sm:gap-2 font-mono text-xs border border-white/20 px-2 sm:px-4 py-1.5 sm:py-2 hover:border-white hover:bg-white/5"><ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /><span>ADMIN</span></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6"><h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">ADMIN MANAGEMENT</h1><p className="font-mono text-xs sm:text-sm text-payload-cyan uppercase tracking-widest">ADVANCED CONTROLS</p></div>

          <div className="flex gap-1 sm:gap-2 mb-6 border-b border-white/10 overflow-x-auto pb-1">
            {[{ id: 'tiers', label: 'TIERS', icon: Crown }, { id: 'announcements', label: 'BROADCASTS', icon: Megaphone }, { id: 'activity', label: 'ACTIVITY', icon: Activity }, { id: 'referrals', label: 'REFERRALS', icon: Gift }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`font-mono text-[10px] sm:text-sm uppercase pb-3 px-2 sm:px-4 whitespace-nowrap flex items-center gap-1 sm:gap-2 ${activeTab === tab.id ? 'text-payload-neon border-b-2 border-payload-neon' : 'text-payload-muted hover:text-payload-text'}`}><tab.icon className="w-3 h-3 sm:w-4 sm:h-4" /><span>{tab.label}</span></button>
            ))}
          </div>

          {loading ? <div className="text-center font-mono py-12">LOADING...</div> : (
            <>
              {activeTab === 'tiers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                      const count = members.filter(m => m.tier === tier).length;
                      return (<div key={tier} className={`${config.bg} border border-white/10 p-3 rounded-sm`}><div className="text-lg mb-1">{config.icon}</div><div className={`font-mono text-[10px] ${config.color} uppercase`}>{config.label}</div><div className="font-mono text-xl text-white">{count}</div></div>);
                    })}
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-lg">{TIER_CONFIG[member.tier || 'junior_recruit'].icon}</span><h3 className="font-rajdhani font-bold text-lg uppercase text-payload-neon truncate">{member.name}</h3></div><p className="font-mono text-xs text-payload-muted truncate">{member.email}</p></div>
                        <select value={member.tier || 'junior_recruit'} onChange={(e) => handleTierChange(member.id, e.target.value)} className="bg-black border border-white/20 text-white py-2 px-3 text-xs uppercase">
                          {Object.entries(TIER_CONFIG).map(([t, c]) => <option key={t} value={t}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'announcements' && (
                <div>
                  <button onClick={() => { setShowAnnouncementForm(true); setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', priority: 'normal', is_pinned: false, target_tiers: null }); }} className="mb-6 flex items-center gap-2 font-mono text-sm border border-payload-neon text-payload-neon px-4 py-2 hover:bg-payload-neon hover:text-black"><Plus className="w-4 h-4" /> NEW</button>
                  {showAnnouncementForm && (
                    <div className="bg-payload-surface border border-payload-neon/50 p-4 sm:p-6 rounded-sm mb-6">
                      <h3 className="font-rajdhani font-bold text-xl mb-4">{editingAnnouncement ? 'EDIT' : 'NEW'} ANNOUNCEMENT</h3>
                      <div className="space-y-4">
                        <input type="text" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})} className="w-full bg-black border border-white/20 p-3 font-mono text-sm" />
                        <textarea placeholder="Content" value={announcementForm.content} onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})} rows={4} className="w-full bg-black border border-white/20 p-3 font-mono text-sm" />
                        <div className="flex flex-wrap gap-4">
                          <select value={announcementForm.priority} onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})} className="bg-black border border-white/20 p-2 font-mono text-sm">{Object.entries(PRIORITY_CONFIG).map(([p, c]) => <option key={p} value={p}>{c.label}</option>)}</select>
                          <label className="flex items-center gap-2 font-mono text-sm"><input type="checkbox" checked={announcementForm.is_pinned} onChange={(e) => setAnnouncementForm({...announcementForm, is_pinned: e.target.checked})} />PIN</label>
                        </div>
                        <div className="flex gap-2"><button onClick={handleCreateAnnouncement} className="font-mono text-sm bg-payload-neon text-black px-4 py-2">{editingAnnouncement ? 'UPDATE' : 'CREATE'}</button><button onClick={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }} className="font-mono text-sm border border-white/20 px-4 py-2">CANCEL</button></div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {announcements.map((a) => (
                      <div key={a.id} className={`bg-payload-surface border ${a.is_pinned ? 'border-payload-alert' : 'border-white/10'} p-4 sm:p-6 rounded-sm ${!a.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1"><div className="flex items-center gap-2 mb-2">{a.is_pinned && <Pin className="w-4 h-4 text-payload-alert" />}<h3 className="font-rajdhani font-bold text-lg uppercase">{a.title}</h3><span className={`font-mono text-[10px] ${PRIORITY_CONFIG[a.priority].color}`}>{a.priority}</span></div><p className="font-inter text-sm text-payload-muted mb-2">{a.content}</p><div className="font-mono text-xs text-payload-muted">{new Date(a.created_at).toLocaleDateString()} • {a.read_by?.length || 0} reads</div></div>
                          <div className="flex gap-2">
                            <button onClick={() => handleTogglePin(a)} className="p-2 hover:bg-white/10">{a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}</button>
                            <button onClick={() => handleToggleActive(a)} className="p-2 hover:bg-white/10"><Eye className={`w-4 h-4 ${a.is_active ? 'text-payload-neon' : 'text-payload-muted'}`} /></button>
                            <button onClick={() => { setEditingAnnouncement(a); setAnnouncementForm(a); setShowAnnouncementForm(true); }} className="p-2 hover:bg-white/10"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-2 hover:bg-red-500/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && <div className="text-center py-12 font-mono text-payload-muted">NO ANNOUNCEMENTS</div>}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && activityStats && (
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><Users className="w-6 h-6 text-payload-neon mb-2" /><div className="font-mono text-xs text-payload-muted">TOTAL</div><div className="font-mono text-2xl text-payload-neon">{activityStats.total_members}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><TrendingUp className="w-6 h-6 text-green-500 mb-2" /><div className="font-mono text-xs text-payload-muted">ACTIVE (7D)</div><div className="font-mono text-2xl text-green-500">{activityStats.active_last_7_days}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><Activity className="w-6 h-6 text-blue-500 mb-2" /><div className="font-mono text-xs text-payload-muted">ACTIVE (30D)</div><div className="font-mono text-2xl text-blue-500">{activityStats.active_last_30_days}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><AlertCircle className="w-6 h-6 text-red-500 mb-2" /><div className="font-mono text-xs text-payload-muted">INACTIVE</div><div className="font-mono text-2xl text-red-500">{activityStats.inactive_members}</div></div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><h3 className="font-rajdhani font-bold text-xl mb-4">TIER DISTRIBUTION</h3><div className="space-y-3">{Object.entries(activityStats.tier_distribution || {}).map(([tier, count]) => (<div key={tier} className="flex items-center justify-between"><div className="flex items-center gap-2"><span>{TIER_CONFIG[tier]?.icon}</span><span className={`font-mono text-sm ${TIER_CONFIG[tier]?.color}`}>{TIER_CONFIG[tier]?.label}</span></div><span className="font-mono text-lg">{count}</span></div>))}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><h3 className="font-rajdhani font-bold text-xl mb-4">RECENT LOGINS</h3><div className="space-y-2 max-h-64 overflow-y-auto">{activityStats.recent_logins?.length > 0 ? activityStats.recent_logins.map((u) => (<div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5"><div><div className="font-mono text-sm">{u.name}</div><div className="font-mono text-xs text-payload-muted">{u.login_count} logins</div></div><div className="font-mono text-xs text-payload-muted">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</div></div>)) : <div className="font-mono text-sm text-payload-muted">No logins</div>}</div></div>
                  </div>
                  {inactiveMembers.length > 0 && (<div className="mt-6 bg-payload-surface border border-red-500/30 p-4 sm:p-6 rounded-sm"><h3 className="font-rajdhani font-bold text-xl mb-4 text-red-500">INACTIVE (30+ DAYS)</h3><div className="space-y-2">{inactiveMembers.slice(0, 10).map((m) => (<div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5"><div><div className="font-mono text-sm">{m.name}</div><div className="font-mono text-xs text-payload-muted">{m.email}</div></div><div className="font-mono text-xs text-red-500">{m.last_login ? `Last: ${new Date(m.last_login).toLocaleDateString()}` : 'Never'}</div></div>))}</div></div>)}
                </div>
              )}

              {activeTab === 'referrals' && referralStats && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><Gift className="w-6 h-6 text-payload-neon mb-2" /><div className="font-mono text-xs text-payload-muted">TOTAL REFERRALS</div><div className="font-mono text-3xl text-payload-neon">{referralStats.total_referrals}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><Check className="w-6 h-6 text-green-500 mb-2" /><div className="font-mono text-xs text-payload-muted">SUCCESSFUL</div><div className="font-mono text-3xl text-green-500">{referralStats.successful_referrals}</div></div>
                    <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><Clock className="w-6 h-6 text-payload-alert mb-2" /><div className="font-mono text-xs text-payload-muted">PENDING</div><div className="font-mono text-3xl text-payload-alert">{referralStats.pending_referrals}</div></div>
                  </div>
                  <div className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm"><h3 className="font-rajdhani font-bold text-xl mb-4">TOP REFERRERS</h3>{referralStats.top_referrers?.length > 0 ? (<div className="space-y-3">{referralStats.top_referrers.map((r, i) => (<div key={r.id} className="flex items-center justify-between py-3 border-b border-white/5"><div className="flex items-center gap-3"><span className="font-mono text-lg text-payload-alert">#{i + 1}</span><div><div className="font-mono text-sm">{r.name}</div><div className="flex items-center gap-2 font-mono text-xs text-payload-muted">CODE: <span className="text-payload-neon">{r.own_referral_code}</span><button onClick={() => copyToClipboard(r.own_referral_code)} className="hover:text-white"><Copy className="w-3 h-3" /></button></div></div></div><div className="text-right"><div className="font-mono text-2xl text-payload-neon">{r.referral_count}</div><div className="font-mono text-xs text-payload-muted">referrals</div></div></div>))}</div>) : (<div className="font-mono text-sm text-payload-muted text-center py-8">NO REFERRALS YET</div>)}</div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminManagement;
