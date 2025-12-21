import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Gift, Copy, Users, CheckCircle, Clock, Instagram, Facebook, Twitter, MessageCircle, Lightbulb, Star, Link, Share2 } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReferralsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate referral link using the current domain
  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${referralData?.own_referral_code}`;
  };

  useEffect(() => { fetchReferralData(); }, []);

  const fetchReferralData = async () => {
    try {
      const [codeRes, referralsRes] = await Promise.all([axios.get(`${API}/users/my-referral-code`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API}/users/my-referrals`, { headers: { Authorization: `Bearer ${token}` } })]);
      setReferralData(codeRes.data); setMyReferrals(referralsRes.data);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const copyCode = () => { navigator.clipboard.writeText(referralData?.own_referral_code); toast.success('Code copied!'); };
  
  const copyLink = () => { navigator.clipboard.writeText(getReferralLink()); toast.success('Referral link copied!'); };
  
  const shareLink = async () => {
    const referralLink = getReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Payload',
          text: 'Join the exclusive Payload business club using my referral link!',
          url: referralLink
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyLink();
      }
    } else {
      copyLink();
    }
  };

  const contentTips = [
    { icon: Instagram, title: 'Instagram Stories', tip: 'Share your Payload journey. Use hashtags like #PayloadClub #ExclusiveAccess' },
    { icon: Facebook, title: 'Facebook Posts', tip: 'Write about business opportunities. Highlight the networking potential.' },
    { icon: Twitter, title: 'Twitter/X Threads', tip: 'Create threads about your experience. Focus on exclusive business club value.' },
    { icon: MessageCircle, title: 'WhatsApp Groups', tip: 'Share directly with trusted contacts interested in business opportunities.' }
  ];

  const getTierFromReferrals = (count) => {
    if (count >= 10) return 'TOP LEADERSHIP';
    if (count >= 5) return 'SENIOR MANAGER';
    if (count >= 3) return 'MID-LEVEL MANAGER';
    if (count >= 1) return 'FRONT-LINE';
    return 'JUNIOR RECRUIT';
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80"><PayloadLogo size="default" /><div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">PAYLOAD</div></button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 font-mono text-xs sm:text-sm border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5"><ArrowLeft className="w-4 h-4" /> DASHBOARD</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">CENSORED REFERRALS</h1>
          <p className="font-mono text-xs sm:text-sm text-payload-muted uppercase tracking-widest mb-8">GROW THE COMMUNITY & ELEVATE YOUR TIER</p>

          {loading ? <div className="text-center font-mono">LOADING...</div> : (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-payload-surface border border-payload-neon/30 p-6 rounded-sm">
                  <div className="flex items-center gap-3 mb-4"><Gift className="w-6 h-6 text-payload-neon" /><h3 className="font-rajdhani font-bold text-xl">YOUR REFERRAL CODE</h3></div>
                  <div className="flex items-center gap-3 bg-black p-4 border border-white/20"><span className="font-mono text-2xl text-payload-neon flex-1">{referralData?.own_referral_code}</span><button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-sm" title="Copy code"><Copy className="w-5 h-5" /></button></div>
                  <p className="font-mono text-xs text-payload-muted mt-3">Share this code with potential members</p>
                </div>

                {/* Shareable Referral Link */}
                <div className="bg-payload-surface border border-payload-cyan/30 p-6 rounded-sm">
                  <div className="flex items-center gap-3 mb-4"><Link className="w-6 h-6 text-payload-cyan" /><h3 className="font-rajdhani font-bold text-xl">YOUR REFERRAL LINK</h3></div>
                  <div className="bg-black p-4 border border-white/20 mb-3">
                    <p className="font-mono text-sm text-payload-cyan break-all">{getReferralLink()}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 bg-payload-cyan/10 border border-payload-cyan/30 py-3 px-4 font-mono text-sm text-payload-cyan hover:bg-payload-cyan/20 transition-colors">
                      <Copy className="w-4 h-4" /> COPY LINK
                    </button>
                    <button onClick={shareLink} className="flex-1 flex items-center justify-center gap-2 bg-payload-neon/10 border border-payload-neon/30 py-3 px-4 font-mono text-sm text-payload-neon hover:bg-payload-neon/20 transition-colors">
                      <Share2 className="w-4 h-4" /> SHARE
                    </button>
                  </div>
                  <p className="font-mono text-xs text-payload-muted mt-3">When someone signs up using this link, they'll automatically be tracked as your referral</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><Users className="w-6 h-6 text-payload-cyan mb-2" /><div className="font-mono text-xs text-payload-muted">TOTAL REFERRALS</div><div className="font-mono text-3xl text-payload-cyan">{referralData?.referral_count || 0}</div></div>
                  <div className="bg-payload-surface border border-white/10 p-4 rounded-sm"><Star className="w-6 h-6 text-yellow-400 mb-2" /><div className="font-mono text-xs text-payload-muted">TIER PROGRESS</div><div className="font-mono text-sm text-yellow-400 mt-1">{getTierFromReferrals(referralData?.referral_count || 0)}</div></div>
                </div>

                <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                  <h3 className="font-rajdhani font-bold text-lg mb-4">YOUR REFERRALS</h3>
                  {myReferrals.length > 0 ? (<div className="space-y-3 max-h-64 overflow-y-auto">{myReferrals.map((ref, i) => (<div key={i} className="flex items-center justify-between py-2 border-b border-white/5"><div><div className="font-mono text-sm">{ref.name}</div><div className="font-mono text-xs text-payload-muted">{new Date(ref.created_at).toLocaleDateString()}</div></div>{ref.status === 'approved' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-payload-alert" />}</div>))}</div>) : (<p className="font-mono text-sm text-payload-muted text-center py-4">No referrals yet. Start sharing!</p>)}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-payload-surface border border-purple-500/30 p-6 rounded-sm">
                  <div className="flex items-center gap-3 mb-4"><Lightbulb className="w-6 h-6 text-purple-400" /><h3 className="font-rajdhani font-bold text-xl">CONTENT CREATION GUIDE</h3></div>
                  <p className="font-mono text-xs text-payload-muted mb-4">Effective ways to share Payload and earn referrals</p>
                  <div className="space-y-4">{contentTips.map((tip, i) => (<div key={i} className="bg-black/30 border border-white/10 p-4 rounded-sm"><div className="flex items-center gap-2 mb-2"><tip.icon className="w-4 h-4 text-purple-400" /><span className="font-mono text-sm font-bold">{tip.title}</span></div><p className="font-inter text-xs text-payload-muted">{tip.tip}</p></div>))}</div>
                </div>

                <div className="bg-payload-surface border border-yellow-500/30 p-6 rounded-sm">
                  <h3 className="font-rajdhani font-bold text-lg mb-4">TIER REWARDS</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-white/5"><span>📝 JUNIOR RECRUIT</span><span className="text-payload-muted">Starting tier</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5"><span>🕵️ FRONT-LINE</span><span className="text-blue-400">1+ referrals</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5"><span>📊 MID-LEVEL MANAGER</span><span className="text-purple-400">3+ referrals</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5"><span>🎯 SENIOR MANAGER</span><span className="text-orange-400">5+ referrals</span></div>
                    <div className="flex justify-between items-center py-2"><span>👑 TOP LEADERSHIP</span><span className="text-yellow-400">10+ referrals</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ReferralsPage;
