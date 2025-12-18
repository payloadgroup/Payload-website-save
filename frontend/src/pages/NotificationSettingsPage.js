import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Bell, MessageCircle, Mail, Save, Info } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_enabled: false,
    whatsapp_number: '',
    email_enabled: true,
    admin_email: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/notifications/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
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
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 font-mono text-xs sm:text-sm border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" /> ADMIN
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">NOTIFICATION SETTINGS</h1>
          <p className="font-mono text-xs sm:text-sm text-payload-cyan uppercase tracking-widest mb-8">NEW REGISTRATION ALERTS</p>

          {loading ? (
            <div className="text-center font-mono">LOADING...</div>
          ) : (
            <div className="space-y-6">
              {/* WhatsApp Notifications */}
              <div className="bg-payload-surface border border-green-500/30 p-6 rounded-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                    <h3 className="font-rajdhani font-bold text-lg">WHATSAPP NOTIFICATIONS</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp_enabled}
                      onChange={(e) => setSettings({...settings, whatsapp_enabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-checked:bg-green-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                {settings.whatsapp_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-mono text-xs text-payload-muted block mb-2">WHATSAPP NUMBER</label>
                      <input
                        type="tel"
                        placeholder="+61 4XX XXX XXX"
                        value={settings.whatsapp_number || ''}
                        onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                        className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-green-500 outline-none"
                      />
                    </div>
                    <div className="flex items-start gap-2 bg-green-500/10 p-3 rounded-sm">
                      <Info className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="font-mono text-xs text-payload-muted">When enabled, you'll receive WhatsApp messages for new member registrations with their name, age, email, and phone number.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Notifications */}
              <div className="bg-payload-surface border border-blue-500/30 p-6 rounded-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-blue-500" />
                    <h3 className="font-rajdhani font-bold text-lg">EMAIL NOTIFICATIONS</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_enabled}
                      onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                {settings.email_enabled && (
                  <div>
                    <label className="font-mono text-xs text-payload-muted block mb-2">ADMIN EMAIL (Optional)</label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={settings.admin_email || ''}
                      onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                      className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 font-mono text-sm bg-payload-neon text-black py-3 hover:bg-payload-neon/80 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
