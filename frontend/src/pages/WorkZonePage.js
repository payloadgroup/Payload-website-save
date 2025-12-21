import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Briefcase, ExternalLink, Mail, Check, AlertCircle, Edit2 } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GOOGLE_SIGNUP_URL = "https://accounts.google.com/lifecycle/steps/signup/name?dsh=S-1422067635:1766287498009093&flowEntry=SignUp&flowName=GlifWebSignIn&ifkv=Ac2yZaVTOg_pmxYiiMI8zszrFr_tWcyf0X4poPtIjkv-j0-_cHNO-I-62xg1gcXkAAlg1WnEXUhJ&TL=AHE1sGX09eEejey_bhgM-2R_W0ABRt1AaepE0dmJRhqYz-KI4iBDWGRqKTHyCC4L&continue=https://accounts.google.com/ManageAccount?nc%3D1";

const WorkZonePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Admin state
  const [adminEmail, setAdminEmail] = useState('');
  const [savedAdminEmail, setSavedAdminEmail] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Member state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [gmailInput, setGmailInput] = useState('');
  const [savedGmail, setSavedGmail] = useState(null);
  const [loadingGmail, setLoadingGmail] = useState(true);
  const [submittingGmail, setSubmittingGmail] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminSettings();
    } else {
      fetchMyGmail();
    }
  }, [isAdmin]);

  // Admin functions
  const fetchAdminSettings = async () => {
    try {
      const response = await axios.get(`${API}/workzone/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedAdminEmail(response.data.admin_google_email);
      setAdminEmail(response.data.admin_google_email || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    setLoadingSettings(false);
  };

  const handleSaveAdminEmail = async () => {
    if (!adminEmail.trim()) {
      toast.error('Please enter a Google account email');
      return;
    }
    setSavingSettings(true);
    try {
      await axios.post(`${API}/workzone/settings`, 
        { admin_google_email: adminEmail.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedAdminEmail(adminEmail.trim());
      setIsEditing(false);
      toast.success('Google account saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setSavingSettings(false);
  };

  // Member functions
  const fetchMyGmail = async () => {
    try {
      const response = await axios.get(`${API}/workzone/my-gmail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedGmail(response.data.gmail_account);
    } catch (error) {
      console.error('Failed to fetch gmail:', error);
    }
    setLoadingGmail(false);
  };

  const handleSubmitGmail = async () => {
    if (!gmailInput.trim()) {
      toast.error('Please enter your Gmail address');
      return;
    }
    if (!gmailInput.toLowerCase().trim().endsWith('@gmail.com')) {
      toast.error('Please enter a valid Gmail address');
      return;
    }
    setSubmittingGmail(true);
    try {
      const response = await axios.post(`${API}/workzone/request-access`, 
        { gmail_account: gmailInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedGmail(response.data.gmail_account);
      setShowRequestModal(false);
      setGmailInput('');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit Gmail');
    }
    setSubmittingGmail(false);
  };

  // Admin View
  const AdminWorkZone = () => (
    <div className="space-y-8">
      {/* Google Account Section */}
      <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
        <h3 className="font-rajdhani font-bold text-xl uppercase mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-payload-neon" />
          GOOGLE ACCOUNT FOR WORK ZONE
        </h3>
        
        {loadingSettings ? (
          <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
        ) : savedAdminEmail && !isEditing ? (
          <div className="space-y-4">
            <div className="bg-black/50 border border-payload-neon/30 p-4 rounded-sm">
              <div className="font-mono text-xs text-payload-muted mb-1">CONNECTED ACCOUNT</div>
              <div className="font-mono text-lg text-[#00ff00] drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
                {savedAdminEmail}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 font-mono text-xs border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5 transition-all"
            >
              <Edit2 className="w-3 h-3" /> CHANGE ACCOUNT
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-payload-muted block mb-2">
                GOOGLE ACCOUNT EMAIL
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter your Google account email"
                className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAdminEmail}
                disabled={savingSettings}
                className="flex items-center gap-2 font-mono text-xs bg-payload-neon text-black px-6 py-2 hover:bg-payload-neon/80 disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> {savingSettings ? 'SAVING...' : 'SAVE'}
              </button>
              {savedAdminEmail && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAdminEmail(savedAdminEmail);
                  }}
                  className="font-mono text-xs border border-white/20 px-6 py-2 hover:border-white"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Access Payload Drive Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => window.open('https://drive.google.com', '_blank')}
        className="bg-gradient-to-br from-payload-surface to-black border border-payload-cyan/30 p-6 rounded-sm cursor-pointer hover:border-payload-cyan/60 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-payload-cyan/20 rounded-sm flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-payload-cyan" />
            </div>
            <div>
              <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-cyan">
                ACCESS PAYLOAD DRIVE WORK ZONE
              </h3>
              <p className="font-mono text-xs text-payload-muted mt-1">
                Open Google Drive to manage shared Payload documents
              </p>
            </div>
          </div>
          <ExternalLink className="w-6 h-6 text-payload-cyan" />
        </div>
      </motion.div>
    </div>
  );

  // Member View
  const MemberWorkZone = () => (
    <div className="space-y-8">
      {loadingGmail ? (
        <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
      ) : savedGmail ? (
        <>
          {/* Gmail Saved Confirmation */}
          <div className="bg-payload-surface border border-payload-neon/30 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-payload-neon/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-payload-neon" />
              </div>
              <div>
                <h3 className="font-rajdhani font-bold text-lg uppercase">GMAIL REGISTERED</h3>
                <p className="font-mono text-xs text-payload-muted">Work Zone access pending provision</p>
              </div>
            </div>
            <div className="bg-black/50 border border-white/10 p-4 rounded-sm">
              <div className="font-mono text-xs text-payload-muted mb-1">YOUR GMAIL ACCOUNT</div>
              <div className="font-mono text-lg text-payload-neon">{savedGmail}</div>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="mt-4 font-mono text-xs border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5"
            >
              UPDATE GMAIL
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Request Access Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setShowRequestModal(true)}
            className="bg-payload-surface border border-payload-alert/30 p-6 rounded-sm cursor-pointer hover:border-payload-alert/60 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-payload-alert/20 rounded-sm flex items-center justify-center">
                <Mail className="w-8 h-8 text-payload-alert" />
              </div>
              <div>
                <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-alert">
                  REQUEST ACCESS TO WORK ZONE
                </h3>
                <p className="font-mono text-xs text-payload-muted mt-1">
                  Submit your Gmail to access shared Payload documents
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Info Card */}
      <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-payload-cyan flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-rajdhani font-bold text-sm uppercase mb-2">ABOUT WORK ZONE</h4>
            <p className="font-inter text-xs text-payload-muted leading-relaxed">
              The Work Zone is a shared Google Drive space where Payload members collaborate on business documents.
              Once your Gmail is registered, an admin will grant you access to the shared drive.
            </p>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-payload-surface border border-payload-neon/50 rounded-sm w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-payload-neon/10 border-b border-payload-neon/30 p-4">
                <h2 className="font-rajdhani font-bold text-xl uppercase text-payload-neon">
                  REQUEST WORK ZONE ACCESS
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="font-mono text-xs text-payload-muted block mb-2">
                    GMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    value={gmailInput}
                    onChange={(e) => setGmailInput(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                  />
                  <p className="font-mono text-[10px] text-payload-muted mt-2">
                    Enter the Gmail account you will use to access shared Payload documents.
                  </p>
                </div>

                <button
                  onClick={() => window.open(GOOGLE_SIGNUP_URL, '_blank')}
                  className="w-full flex items-center justify-center gap-2 font-mono text-xs border border-payload-cyan/50 text-payload-cyan px-4 py-3 hover:bg-payload-cyan/10 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  IF YOU DON'T HAVE A GMAIL ACCOUNT, CLICK HERE TO CREATE ONE
                </button>
              </div>

              <div className="border-t border-white/10 p-4 flex gap-2">
                <button
                  onClick={handleSubmitGmail}
                  disabled={submittingGmail}
                  className="flex-1 flex items-center justify-center gap-2 font-mono text-sm bg-payload-neon text-black py-2 hover:bg-payload-neon/80 disabled:opacity-50"
                >
                  {submittingGmail ? 'SUBMITTING...' : 'SUBMIT'}
                </button>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setGmailInput('');
                  }}
                  className="font-mono text-sm border border-white/20 px-6 py-2 hover:bg-white/10"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

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
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-payload-alert" />
              WORK ZONE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-alert uppercase tracking-widest">
              {isAdmin ? 'ADMIN CONTROL CENTER' : 'COLLABORATIVE WORKSPACE ACCESS'}
            </p>
          </div>

          {isAdmin ? <AdminWorkZone /> : <MemberWorkZone />}
        </motion.div>
      </div>
    </div>
  );
};

export default WorkZonePage;
