import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, User, MapPin, Briefcase, CreditCard } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.onboarding_complete) {
        navigate('/dashboard');
      }
      // Pre-fill any existing data
      if (response.data) {
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
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const handleComplete = async () => {
    if (!formData.credit_score) {
      toast.error('Please enter your credit score');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/users/profile`, {
        ...formData,
        onboarding_complete: true
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile completed!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile');
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <PayloadLogo size="default" />
          <div className="font-rajdhani font-bold text-2xl tracking-widest text-payload-neon">PAYLOAD</div>
        </div>

        <div className="bg-payload-surface border border-white/10 p-8 rounded-sm">
          <h1 className="font-rajdhani font-bold text-2xl uppercase tracking-wide mb-2 text-center">WELCOME, {user?.name?.split(' ')[0]}</h1>
          <p className="font-mono text-xs text-payload-muted text-center mb-6">COMPLETE YOUR PROFILE TO CONTINUE</p>

          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-16 h-1 ${s <= step ? 'bg-payload-neon' : 'bg-white/20'}`} />
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-payload-alert" />
                <span className="font-mono text-sm">YOUR ADDRESS</span>
              </div>
              <input placeholder="Street Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
                <input placeholder="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Postcode" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className="bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
                <input placeholder="Country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-payload-cyan" />
                <span className="font-mono text-sm">OCCUPATION</span>
              </div>
              <input placeholder="Job Title / Occupation" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} className="w-full bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
              <input placeholder="Company / Employer (Optional)" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full bg-black border-b border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none" />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-payload-neon" />
                <span className="font-mono text-sm">CREDIT SCORE</span>
              </div>
              <p className="font-mono text-xs text-payload-muted mb-4">Enter your Australian credit score (0-1200). This helps us assess your eligibility for certain opportunities.</p>
              <input type="number" min="0" max="1200" placeholder="e.g., 750" value={formData.credit_score} onChange={(e) => setFormData({...formData, credit_score: e.target.value})} className="w-full bg-black border border-payload-neon/50 p-4 font-mono text-2xl text-payload-neon text-center focus:border-payload-neon outline-none" />
              <div className="flex justify-between text-xs font-mono text-payload-muted mt-2">
                <span>0 - Poor</span>
                <span>500 - Fair</span>
                <span>700 - Good</span>
                <span>800+ - Excellent</span>
              </div>
            </motion.div>
          )}

          <button onClick={nextStep} disabled={loading} className="w-full mt-8 flex items-center justify-center gap-2 font-rajdhani font-bold text-lg uppercase border-2 border-payload-neon text-payload-neon py-3 hover:bg-payload-neon hover:text-black transition-all disabled:opacity-50">
            {loading ? 'SAVING...' : step < 3 ? 'CONTINUE' : 'COMPLETE'}
            <ArrowRight className="w-5 h-5" />
          </button>

          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="w-full mt-2 font-mono text-sm text-payload-muted hover:text-white">
              Go Back
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
