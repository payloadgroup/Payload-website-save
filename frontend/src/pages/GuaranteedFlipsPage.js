import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, TrendingUp, Lock, Unlock, Building, Briefcase, Star, 
  ArrowRightLeft, Shield, Send, Paperclip, X, FileText, Image, 
  Eye, Archive, Clock, CheckCircle, ChevronDown, ChevronUp, Settings, Award
} from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_LABELS = {
  junior_recruit: 'Junior Recruit',
  front_line: 'Front Line',
  mid_level_manager: 'Mid Level Manager',
  senior_manager: 'Senior Manager',
  top_leadership: 'Top Leadership'
};

const TIER_ORDER = ['junior_recruit', 'front_line', 'mid_level_manager', 'senior_manager', 'top_leadership'];

const SECTION_ICONS = {
  property: Building,
  business: Briefcase,
  unique: Star,
  arbitrage: ArrowRightLeft,
  top_secret: Shield
};

const SECTION_COLORS = {
  property: 'payload-cyan',
  business: 'payload-neon',
  unique: 'purple-400',
  arbitrage: 'payload-alert',
  top_secret: 'red-500'
};

const GuaranteedFlipsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef(null);

  // Access state
  const [accessData, setAccessData] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(true);

  // Submission state
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Admin state
  const [tierSettings, setTierSettings] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [submissionTab, setSubmissionTab] = useState('active'); // 'active' or 'achieved'

  useEffect(() => {
    fetchAccessData();
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin, token]);

  const fetchAccessData = async () => {
    try {
      const endpoint = isAdmin ? '/flips/tier-access' : '/flips/my-access';
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessData(response.data);
      
      if (isAdmin) {
        // Initialize tier settings from response
        const settings = {};
        Object.keys(response.data).forEach(section => {
          settings[section] = response.data[section].required_tier;
        });
        setTierSettings(settings);
      }
    } catch (error) {
      console.error('Failed to fetch access data:', error);
      toast.error('Failed to load access settings');
    }
    setLoadingAccess(false);
  };

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API}/flips/admin/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
    setLoadingSubmissions(false);
  };

  const handleSaveTierSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.post(`${API}/flips/tier-access`, tierSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tier access settings saved');
      fetchAccessData();
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setSavingSettings(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'application/pdf', 'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Max 10MB.`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOpportunity = async () => {
    if (!submissionContent.trim()) {
      toast.error('Please enter your opportunity details');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', submissionContent);
      attachments.forEach(file => {
        formData.append('files', file);
      });

      await axios.post(`${API}/flips/submit-opportunity`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Opportunity submitted successfully!');
      setSubmissionContent('');
      setAttachments([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit');
    }
    setSubmitting(false);
  };

  const handleUpdateSubmissionStatus = async (submissionId, status) => {
    try {
      await axios.post(`${API}/flips/admin/submission/${submissionId}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Submission marked as ${status}`);
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const viewAttachment = async (submissionId, filename, contentType) => {
    try {
      const response = await axios.get(`${API}/flips/admin/attachment/${submissionId}/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const binaryData = atob(response.data.data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to load attachment');
    }
  };

  const getSections = () => {
    if (isAdmin && accessData) {
      return Object.entries(accessData).map(([key, value]) => ({
        id: key,
        ...value,
        has_access: true
      }));
    }
    if (!isAdmin && accessData?.sections) {
      return Object.entries(accessData.sections).map(([key, value]) => ({
        id: key,
        ...value
      }));
    }
    return [];
  };

  const sections = getSections();

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-payload-neon" />
              GUARANTEED FLIPS
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-muted">
              Pooling resources and ideas to execute on exclusive opportunities
            </p>
            {!isAdmin && accessData && (
              <div className="mt-2 inline-block bg-payload-surface border border-payload-neon/30 px-3 py-1 rounded-sm">
                <span className="font-mono text-xs text-payload-muted">YOUR TIER: </span>
                <span className="font-mono text-xs text-payload-neon uppercase">{TIER_LABELS[accessData.user_tier]}</span>
              </div>
            )}
          </div>

          {loadingAccess ? (
            <div className="text-center font-mono text-payload-muted py-12">LOADING...</div>
          ) : (
            <>
              {/* Sections Grid */}
              <div className="grid gap-4 mb-8">
                {sections.map((section, index) => {
                  const IconComponent = SECTION_ICONS[section.id];
                  const colorClass = SECTION_COLORS[section.id];
                  const isLocked = !section.has_access;

                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !isLocked && navigate(`/guaranteed-flips/${section.id}`)}
                      className={`bg-payload-surface border rounded-sm overflow-hidden ${
                        isLocked 
                          ? 'border-white/10 opacity-60 cursor-not-allowed' 
                          : `border-${colorClass}/30 hover:border-${colorClass}/60 cursor-pointer`
                      } transition-all`}
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 ${
                              isLocked ? 'bg-white/5' : `bg-${colorClass}/20`
                            }`}>
                              {isLocked ? (
                                <Lock className="w-6 h-6 text-payload-muted" />
                              ) : (
                                <IconComponent className={`w-6 h-6 text-${colorClass}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-rajdhani font-bold text-lg sm:text-xl uppercase ${
                                isLocked ? 'text-payload-muted' : `text-${colorClass}`
                              }`}>
                                {section.title}
                              </h3>
                              <p className="font-inter text-xs sm:text-sm text-payload-muted mt-1 leading-relaxed">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isLocked ? (
                              <div className="text-right">
                                <Lock className="w-5 h-5 text-payload-muted mb-1" />
                                <div className="font-mono text-[10px] text-payload-muted">
                                  REQUIRES<br/>
                                  <span className="text-payload-alert uppercase">{TIER_LABELS[section.required_tier]}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-payload-muted">VIEW PLAYS</span>
                                <Unlock className="w-5 h-5 text-payload-neon" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Member Opportunity Submission Section */}
              {!isAdmin && (
                <div className="bg-payload-surface border border-payload-alert/30 rounded-sm p-6 mb-8">
                  <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-alert mb-1 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    I HAVE AN OPPORTUNITY TO SHARE
                  </h3>
                  <p className="font-mono text-xs text-payload-muted mb-4">
                    If you think you have an opportunity that is worth the director's time, submit it here.
                  </p>

                  <div className="space-y-4">
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Describe your opportunity in detail..."
                      rows={5}
                      className="w-full bg-black border border-white/20 p-4 font-mono text-sm focus:border-payload-alert outline-none resize-none"
                    />

                    {/* Attachments */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 font-mono text-xs border border-white/20 px-4 py-2 hover:border-white hover:bg-white/5"
                      >
                        <Paperclip className="w-4 h-4" />
                        ATTACH FILES (PDF, DOC, IMAGES)
                      </button>

                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-black/50 border border-white/10 px-3 py-2 rounded-sm">
                              <div className="flex items-center gap-2">
                                {file.type.startsWith('image/') ? (
                                  <Image className="w-4 h-4 text-payload-cyan" />
                                ) : (
                                  <FileText className="w-4 h-4 text-payload-alert" />
                                )}
                                <span className="font-mono text-xs truncate max-w-[200px]">{file.name}</span>
                                <span className="font-mono text-[10px] text-payload-muted">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-white/10">
                                <X className="w-4 h-4 text-payload-muted" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitOpportunity}
                      disabled={submitting || !submissionContent.trim()}
                      className="flex items-center gap-2 font-mono text-sm bg-payload-alert text-black px-6 py-2 hover:bg-payload-alert/80 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'SUBMITTING...' : 'SUBMIT OPPORTUNITY'}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Sections */}
              {isAdmin && (
                <>
                  {/* Member Submissions Section */}
                  <div className="bg-payload-surface border border-white/10 rounded-sm p-6 mb-8">
                    <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-cyan mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      MEMBER OPPORTUNITY SUBMISSIONS
                    </h3>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setSubmissionTab('active')}
                        className={`font-mono text-xs px-4 py-2 transition-all ${
                          submissionTab === 'active'
                            ? 'bg-payload-cyan text-black'
                            : 'border border-white/20 hover:bg-white/10'
                        }`}
                      >
                        ACTIVE ({submissions.filter(s => s.status !== 'achieved').length})
                      </button>
                      <button
                        onClick={() => setSubmissionTab('achieved')}
                        className={`font-mono text-xs px-4 py-2 transition-all flex items-center gap-1 ${
                          submissionTab === 'achieved'
                            ? 'bg-green-500 text-black'
                            : 'border border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <Award className="w-3 h-3" />
                        ACHIEVED ({submissions.filter(s => s.status === 'achieved').length})
                      </button>
                    </div>

                    {loadingSubmissions ? (
                      <div className="text-center font-mono text-payload-muted py-8">LOADING...</div>
                    ) : submissions.filter(s => submissionTab === 'achieved' ? s.status === 'achieved' : s.status !== 'achieved').length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-payload-muted mx-auto mb-3" />
                        <p className="font-mono text-sm text-payload-muted">
                          {submissionTab === 'achieved' ? 'NO ACHIEVED SUBMISSIONS YET' : 'NO SUBMISSIONS YET'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {submissions.filter(s => submissionTab === 'achieved' ? s.status === 'achieved' : s.status !== 'achieved').map((submission) => (
                          <div key={submission.id} className="bg-black/50 border border-white/10 rounded-sm overflow-hidden">
                            <div 
                              className="p-4 cursor-pointer hover:bg-white/5"
                              onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-rajdhani font-bold text-lg">{submission.user_name}</span>
                                    <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase ${
                                      submission.status === 'pending' ? 'bg-payload-alert/20 text-payload-alert' :
                                      submission.status === 'reviewed' ? 'bg-payload-neon/20 text-payload-neon' :
                                      submission.status === 'achieved' ? 'bg-green-500/20 text-green-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {submission.status}
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs text-payload-muted">{submission.user_email}</div>
                                  <p className="font-inter text-sm text-payload-text mt-2 line-clamp-2">{submission.content}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="font-mono text-[10px] text-payload-muted">
                                      {new Date(submission.submitted_at).toLocaleString()}
                                    </span>
                                    {submission.attachments?.length > 0 && (
                                      <span className="font-mono text-[10px] text-payload-cyan flex items-center gap-1">
                                        <Paperclip className="w-3 h-3" />
                                        {submission.attachments.length} attachment(s)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {expandedSubmission === submission.id ? (
                                  <ChevronUp className="w-5 h-5 text-payload-muted flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-payload-muted flex-shrink-0" />
                                )}
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedSubmission === submission.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/10"
                                >
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <div className="font-mono text-xs text-payload-muted mb-2">FULL MESSAGE:</div>
                                      <p className="font-inter text-sm text-payload-text whitespace-pre-wrap bg-black/30 p-3 rounded-sm">
                                        {submission.content}
                                      </p>
                                    </div>

                                    {submission.attachments?.length > 0 && (
                                      <div>
                                        <div className="font-mono text-xs text-payload-muted mb-2">ATTACHMENTS:</div>
                                        <div className="space-y-2">
                                          {submission.attachments.map((att, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => viewAttachment(submission.id, att.filename, att.content_type)}
                                              className="flex items-center gap-2 bg-black/30 border border-white/10 px-3 py-2 rounded-sm hover:border-payload-cyan w-full text-left"
                                            >
                                              {att.content_type.startsWith('image/') ? (
                                                <Image className="w-4 h-4 text-payload-cyan" />
                                              ) : (
                                                <FileText className="w-4 h-4 text-payload-alert" />
                                              )}
                                              <span className="font-mono text-xs flex-1 truncate">{att.filename}</span>
                                              <Eye className="w-4 h-4 text-payload-muted" />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {submission.status !== 'reviewed' && (
                                        <button
                                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'reviewed')}
                                          className="flex items-center gap-1 font-mono text-xs bg-payload-neon text-black px-4 py-2 hover:bg-payload-neon/80"
                                        >
                                          <CheckCircle className="w-3 h-3" /> MARK REVIEWED
                                        </button>
                                      )}
                                      {submission.status !== 'achieved' && (
                                        <button
                                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'achieved')}
                                          className="flex items-center gap-1 font-mono text-xs bg-green-500 text-black px-4 py-2 hover:bg-green-500/80"
                                        >
                                          <Award className="w-3 h-3" /> MARK ACHIEVED
                                        </button>
                                      )}
                                      {submission.status !== 'archived' && (
                                        <button
                                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'archived')}
                                          className="flex items-center gap-1 font-mono text-xs border border-white/20 px-4 py-2 hover:bg-white/10"
                                        >
                                          <Archive className="w-3 h-3" /> ARCHIVE
                                        </button>
                                      )}
                                      {submission.status !== 'pending' && (
                                        <button
                                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'pending')}
                                          className="flex items-center gap-1 font-mono text-xs border border-payload-alert/50 text-payload-alert px-4 py-2 hover:bg-payload-alert/10"
                                        >
                                          <Clock className="w-3 h-3" /> MARK PENDING
                                        </button>
                                      )}
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

                  {/* Tier Access Settings Section */}
                  <div className="bg-payload-surface border border-white/10 rounded-sm p-6">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="w-full flex items-center justify-between"
                    >
                      <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-alert flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        TIER ACCESS SETTINGS
                      </h3>
                      {showSettings ? (
                        <ChevronUp className="w-5 h-5 text-payload-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-payload-muted" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <p className="font-mono text-xs text-payload-muted mt-2 mb-4">
                            Customize which tier unlocks each section
                          </p>

                          <div className="space-y-4">
                            {sections.map((section) => {
                              const IconComponent = SECTION_ICONS[section.id];
                              return (
                                <div key={section.id} className="flex items-center justify-between gap-4 bg-black/30 p-4 rounded-sm">
                                  <div className="flex items-center gap-3">
                                    <IconComponent className="w-5 h-5 text-payload-muted" />
                                    <span className="font-rajdhani font-bold text-sm uppercase">{section.title}</span>
                                  </div>
                                  <select
                                    value={tierSettings[section.id] || section.required_tier}
                                    onChange={(e) => setTierSettings(prev => ({
                                      ...prev,
                                      [section.id]: e.target.value
                                    }))}
                                    className="bg-black border border-white/20 px-3 py-2 font-mono text-xs focus:border-payload-neon outline-none"
                                  >
                                    {TIER_ORDER.map(tier => (
                                      <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={handleSaveTierSettings}
                            disabled={savingSettings}
                            className="mt-4 flex items-center gap-2 font-mono text-sm bg-payload-neon text-black px-6 py-2 hover:bg-payload-neon/80 disabled:opacity-50"
                          >
                            {savingSettings ? 'SAVING...' : 'SAVE TIER SETTINGS'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GuaranteedFlipsPage;
