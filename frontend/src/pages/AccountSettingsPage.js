import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState({ email: false, password: false });

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, email: true });
    try {
      await axios.put(`${API}/users/change-email`, emailForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Email updated successfully. Please login again.');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update email');
    }
    setLoading({ ...loading, email: false });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading({ ...loading, password: true });
    try {
      await axios.put(`${API}/users/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Password updated successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    }
    setLoading({ ...loading, password: false });
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">ACCOUNT SETTINGS</h1>
          <p className="font-mono text-xs sm:text-sm text-payload-cyan uppercase tracking-widest mb-8">SECURITY & CREDENTIALS</p>

          <div className="space-y-8">
            {/* Change Email */}
            <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-payload-cyan" />
                <h3 className="font-rajdhani font-bold text-lg">CHANGE EMAIL</h3>
              </div>
              <p className="font-mono text-xs text-payload-muted mb-4">Current: {user?.email}</p>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <input type="email" required placeholder="New Email Address" value={emailForm.new_email} onChange={(e) => setEmailForm({...emailForm, new_email: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 font-mono text-sm focus:border-payload-neon outline-none" />
                <input type="password" required placeholder="Current Password" value={emailForm.password} onChange={(e) => setEmailForm({...emailForm, password: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 font-mono text-sm focus:border-payload-neon outline-none" />
                <button type="submit" disabled={loading.email} className="flex items-center gap-2 font-mono text-sm border border-payload-cyan text-payload-cyan px-4 py-2 hover:bg-payload-cyan hover:text-black disabled:opacity-50">
                  <Save className="w-4 h-4" /> {loading.email ? 'UPDATING...' : 'UPDATE EMAIL'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-payload-alert" />
                <h3 className="font-rajdhani font-bold text-lg">CHANGE PASSWORD</h3>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="relative">
                  <input type={showPasswords.current ? 'text' : 'password'} required placeholder="Current Password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 pr-10 font-mono text-sm focus:border-payload-neon outline-none" />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-2 top-2 text-payload-muted">
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showPasswords.new ? 'text' : 'password'} required placeholder="New Password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 pr-10 font-mono text-sm focus:border-payload-neon outline-none" />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-2 top-2 text-payload-muted">
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showPasswords.confirm ? 'text' : 'password'} required placeholder="Confirm New Password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="w-full bg-black border-b border-white/20 p-2 pr-10 font-mono text-sm focus:border-payload-neon outline-none" />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-2 top-2 text-payload-muted">
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading.password} className="flex items-center gap-2 font-mono text-sm border border-payload-alert text-payload-alert px-4 py-2 hover:bg-payload-alert hover:text-black disabled:opacity-50">
                  <Save className="w-4 h-4" /> {loading.password ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
