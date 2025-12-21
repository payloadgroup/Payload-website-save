import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Briefcase, ExternalLink, Mail, Check, AlertCircle, Edit2, Clock, CheckCircle, XCircle, Users, UserCheck } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GOOGLE_WORKSPACE_URL = "https://workspace.google.com/";
const GOOGLE_DRIVE_URL = "https://drive.google.com/";

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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [processingUser, setProcessingUser] = useState(null);

  // Member state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [gmailInput, setGmailInput] = useState('');
  const [savedGmail, setSavedGmail] = useState(null);
  const [accessStatus, setAccessStatus] = useState('none');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submittingGmail, setSubmittingGmail] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminSettings();
      fetchPendingRequests();
      fetchApprovedMembers();
    } else {
      fetchMyStatus();
    }
  }, [isAdmin, token]);

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

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API}/workzone/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
    setLoadingRequests(false);
  };

  const fetchApprovedMembers = async () => {
    try {
      const response = await axios.get(`${API}/workzone/approved-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch approved members:', error);
    }
    setLoadingApproved(false);
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

  const handleApproveAccess = async (userId, userName) => {
    setProcessingUser(userId);
    try {
      await axios.post(`${API}/workzone/approve-access/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Access granted to ${userName}`);
      fetchPendingRequests();
      fetchApprovedMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve access');
    }
    setProcessingUser(null);
  };

  const handleRemoveRequest = async (userId, userName) => {
    if (!window.confirm(`Remove Work Zone request from ${userName}?`)) return;
    setProcessingUser(userId);
    try {
      await axios.post(`${API}/workzone/remove-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Request removed for ${userName}`);
      fetchPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove request');
    }
    setProcessingUser(null);
  };

  // Member functions
  const fetchMyStatus = async () => {
    try {
      const response = await axios.get(`${API}/workzone/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedGmail(response.data.gmail_account);
      setAccessStatus(response.data.workzone_access_status || 'none');
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
    setLoadingStatus(false);
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
      setAccessStatus(response.data.workzone_access_status || 'pending');
      setShowRequestModal(false);
      setGmailInput('');
      toast.success('Gmail submitted. Awaiting Director approval.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit Gmail');
    }
    setSubmittingGmail(false);
  };

  const handleAdminEmailChange = (e) => {
    setAdminEmail(e.target.value);
  };

  const handleGmailInputChange = (e) => {
    setGmailInput(e.target.value);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAdminEmail(savedAdminEmail || '');
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setGmailInput('');
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
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-payload-alert" />
              WORK ZONE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-alert uppercase tracking-widest">
              {isAdmin ? 'ADMIN CONTROL CENTER' : 'COLLABORATIVE WORKSPACE ACCESS'}
            </p>
          </div>

          {/* Admin View */}
          {isAdmin && (
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
                        onChange={handleAdminEmailChange}
                        placeholder="Enter your Google account email"
                        className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                        autoFocus
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
                          onClick={handleCancelEdit}
                          className="font-mono text-xs border border-white/20 px-6 py-2 hover:border-white"
                        >
                          CANCEL
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Access Requests Section */}
              <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                <h3 className="font-rajdhani font-bold text-xl uppercase mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-payload-alert" />
                  MEMBER ACCESS REQUESTS
                </h3>
                
                {loadingRequests ? (
                  <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-payload-muted mx-auto mb-3" />
                    <p className="font-mono text-sm text-payload-muted">NO PENDING REQUESTS</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div 
                        key={request.user_id} 
                        className="bg-black/50 border border-payload-alert/30 p-4 rounded-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-rajdhani font-bold text-lg text-payload-alert truncate">
                              {request.user_name}
                            </div>
                            <div className="font-mono text-xs text-payload-muted truncate">
                              {request.user_email}
                            </div>
                            <div className="font-mono text-xs text-payload-cyan mt-1">
                              Gmail: {request.gmail_account}
                            </div>
                            <div className="font-mono text-[10px] text-payload-muted mt-1">
                              Requested: {new Date(request.requested_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveAccess(request.user_id, request.user_name)}
                              disabled={processingUser === request.user_id}
                              className="flex items-center gap-1 font-mono text-xs bg-payload-neon text-black px-4 py-2 hover:bg-payload-neon/80 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {processingUser === request.user_id ? '...' : 'APPROVE'}
                            </button>
                            <button
                              onClick={() => handleRemoveRequest(request.user_id, request.user_name)}
                              disabled={processingUser === request.user_id}
                              className="flex items-center gap-1 font-mono text-xs border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500 hover:text-white disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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

              {/* Approved Members Section */}
              <div className="bg-payload-surface border border-white/10 p-6 rounded-sm">
                <h3 className="font-rajdhani font-bold text-xl uppercase mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-payload-neon" />
                  APPROVED WORK ZONE MEMBERS
                </h3>
                
                {loadingApproved ? (
                  <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
                ) : approvedMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-payload-muted mx-auto mb-3" />
                    <p className="font-mono text-sm text-payload-muted">NO APPROVED MEMBERS YET</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedMembers.map((member) => (
                      <div 
                        key={member.user_id} 
                        className="bg-black/50 border border-payload-neon/20 p-4 rounded-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-payload-neon flex-shrink-0" />
                              <span className="font-rajdhani font-bold text-lg text-payload-neon truncate">
                                {member.user_name}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-payload-muted truncate mt-1">
                              {member.user_email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-payload-cyan truncate">
                              {member.gmail_account}
                            </div>
                            <div className="font-mono text-[10px] text-payload-muted mt-1">
                              Approved: {new Date(member.requested_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member View */}
          {!isAdmin && (
            <div className="space-y-8">
              {loadingStatus ? (
                <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
              ) : accessStatus === 'approved' ? (
                <>
                  {/* Access Granted */}
                  <div className="bg-payload-surface border border-payload-neon/50 p-6 rounded-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-payload-neon/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-payload-neon" />
                      </div>
                      <div>
                        <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-neon">ACCESS GRANTED</h3>
                        <p className="font-mono text-xs text-payload-muted">You have been approved for Work Zone access</p>
                      </div>
                    </div>
                    <div className="bg-black/50 border border-white/10 p-4 rounded-sm">
                      <div className="font-mono text-xs text-payload-muted mb-1">YOUR GMAIL ACCOUNT</div>
                      <div className="font-mono text-lg text-payload-neon">{savedGmail}</div>
                    </div>
                  </div>

                  {/* Access Payload Drive Work Zone Card */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => window.open(GOOGLE_DRIVE_URL, '_blank')}
                    className="bg-gradient-to-br from-payload-surface to-black border-2 border-payload-cyan/50 p-6 rounded-sm cursor-pointer hover:border-payload-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all"
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
                            Open Google Drive to access shared Payload documents
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-6 h-6 text-payload-cyan" />
                    </div>
                  </motion.div>
                </>
              ) : accessStatus === 'pending' ? (
                <>
                  {/* Pending Approval Status */}
                  <div className="bg-payload-surface border border-payload-alert/50 p-6 rounded-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-payload-alert/20 rounded-full flex items-center justify-center animate-pulse">
                        <Clock className="w-6 h-6 text-payload-alert" />
                      </div>
                      <div>
                        <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-alert">PENDING APPROVAL BY DIRECTOR</h3>
                        <p className="font-mono text-xs text-payload-muted">Your request is being reviewed</p>
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
                      Once your Gmail is registered and approved by a Director, you will gain access to the shared drive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Request Access Modal - Outside of conditional rendering */}
          <AnimatePresence>
            {showRequestModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleCloseModal}
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
                      {savedGmail ? 'UPDATE GMAIL' : 'REQUEST WORK ZONE ACCESS'}
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
                        onChange={handleGmailInputChange}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-payload-neon outline-none"
                        autoFocus
                      />
                      <p className="font-mono text-[10px] text-payload-muted mt-2">
                        Enter the Gmail account you will use to access shared Payload documents.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.open(GOOGLE_WORKSPACE_URL, '_blank')}
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
                      onClick={handleCloseModal}
                      className="font-mono text-sm border border-white/20 px-6 py-2 hover:bg-white/10"
                    >
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkZonePage;
