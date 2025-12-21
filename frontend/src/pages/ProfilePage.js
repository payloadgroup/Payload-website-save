import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, CreditCard, Save, Briefcase } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    occupation: '',
    company: '',
    credit_score: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setFormData(prev => ({
        ...prev,
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        postcode: response.data.postcode || '',
        country: response.data.country || 'Australia',
        occupation: response.data.occupation || '',
        company: response.data.company || '',
        credit_score: response.data.credit_score || ''
      }));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80">
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">PAYLOAD</div>
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 font-mono text-xs sm:text-sm border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" /> DASHBOARD
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">MY PROFILE</h1>
          <p className="font-mono text-xs sm:text-sm text-payload-cyan uppercase tracking-widest mb-8">PERSONAL INFORMATION</p>

          {loading ? (
            <div className="text-center font-mono text-payload-muted">LOADING...</div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info - Read Only */}
              <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                <h3 className="font-rajdhani font-bold text-lg mb-4">BASIC INFORMATION</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-payload-neon" />
                    <div>
                      <div className="font-mono text-xs text-payload-muted">FULL NAME</div>
                      <div className="font-mono text-sm">{user?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-payload-cyan" />
                    <div>
                      <div className="font-mono text-xs text-payload-muted">EMAIL</div>
                      <div className="font-mono text-sm">{user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-payload-alert" />
                    <div>
                      <div className="font-mono text-xs text-payload-muted">MOBILE</div>
                      <div className="font-mono text-sm">{profile?.mobile || 'Not set'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-mono text-xs text-payload-muted">DATE OF BIRTH</div>
                      <div className="font-mono text-sm">{profile?.date_of_birth || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Score */}
              <div className="bg-payload-surface border border-payload-neon/30 p-6 rounded-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-payload-neon" />
                  <h3 className="font-rajdhani font-bold text-lg">CREDIT SCORE</h3>
                </div>
                <input
                  type="number"
                  min="0"
                  max="1200"
                  placeholder="Enter your credit score (e.g., 750)"
                  value={formData.credit_score}
                  onChange={(e) => setFormData({...formData, credit_score: e.target.value})}
                  className="w-full bg-black border border-white/20 p-3 font-mono text-lg text-payload-neon"
                />
                <p className="font-mono text-xs text-payload-muted mt-2">Australian credit scores range from 0-1200</p>
              </div>

              {/* Address */}
              <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-payload-alert" />
                  <h3 className="font-rajdhani font-bold text-lg">ADDRESS</h3>
                </div>
                <div className="space-y-4">
                  <input placeholder="Street Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 font-mono text-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                    <input placeholder="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Postcode" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                    <input placeholder="Country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                  </div>
                </div>
              </div>

              {/* Occupation */}
              <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                <h3 className="font-rajdhani font-bold text-lg mb-4">OCCUPATION</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="Occupation/Job Title" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                  <input placeholder="Company/Employer" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="bg-black border-b border-white/20 p-2 font-mono text-sm" />
                </div>
              </div>

              <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 font-mono text-sm bg-payload-neon text-black py-3 hover:bg-payload-neon/80 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE PROFILE'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
