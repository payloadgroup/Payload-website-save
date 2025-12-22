import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Users, Briefcase, CheckCircle, Clock, TrendingUp, Award, ChevronRight } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemberProgressPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { memberId } = useParams();
  const [membersProgress, setMembersProgress] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (memberId) {
      fetchMemberDetail(memberId);
    } else {
      fetchAllMembersProgress();
    }
  }, [memberId]);

  const fetchAllMembersProgress = async () => {
    try {
      const res = await axios.get(`${API}/projects/admin/member-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembersProgress(res.data);
    } catch (error) {
      console.error('Failed to fetch member progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetail = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/projects/admin/member/${userId}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemberDetail(res.data);
      setSelectedMember(res.data.member);
    } catch (error) {
      console.error('Failed to fetch member detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member) => {
    navigate(`/admin/member-progress/${member.user_id}`);
  };

  const getTierBadgeColor = (tier) => {
    const colors = {
      junior_recruit: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      front_line: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      mid_level_manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      senior_manager: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      top_leadership: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[tier] || colors.junior_recruit;
  };

  const formatTierName = (tier) => {
    return tier?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-400';
    if (progress >= 50) return 'from-payload-cyan to-blue-400';
    if (progress >= 25) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-pink-500';
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-payload-cyan" />;
      default: return <Clock className="w-4 h-4 text-payload-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-payload-bg flex items-center justify-center">
        <div className="font-mono text-payload-muted">LOADING...</div>
      </div>
    );
  }

  // Member Detail View
  if (memberId && memberDetail) {
    return (
      <div className="min-h-screen bg-payload-bg text-payload-text p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/admin/member-progress')}
              className="p-2 border border-white/10 hover:border-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-rajdhani font-bold text-2xl sm:text-3xl uppercase tracking-wide">
                {selectedMember?.name}
              </h1>
              <p className="font-mono text-sm text-payload-muted">{selectedMember?.email}</p>
            </div>
            <span className={`ml-auto font-mono text-xs px-3 py-1 border rounded-sm ${getTierBadgeColor(selectedMember?.tier)}`}>
              {formatTierName(selectedMember?.tier)}
            </span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-payload-surface border border-white/10 p-4 rounded-sm">
              <Briefcase className="w-6 h-6 text-payload-neon mb-2" />
              <div className="font-mono text-2xl text-payload-neon">{memberDetail.projects.length}</div>
              <div className="font-mono text-xs text-payload-muted">TOTAL PROJECTS</div>
            </div>
            <div className="bg-payload-surface border border-white/10 p-4 rounded-sm">
              <TrendingUp className="w-6 h-6 text-payload-cyan mb-2" />
              <div className="font-mono text-2xl text-payload-cyan">
                {memberDetail.projects.filter(p => p.status === 'active').length}
              </div>
              <div className="font-mono text-xs text-payload-muted">ACTIVE</div>
            </div>
            <div className="bg-payload-surface border border-white/10 p-4 rounded-sm">
              <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
              <div className="font-mono text-2xl text-green-400">
                {memberDetail.projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="font-mono text-xs text-payload-muted">COMPLETED</div>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-6">
            {memberDetail.projects.length === 0 ? (
              <div className="text-center py-12 bg-payload-surface border border-white/10 rounded-sm">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-payload-muted opacity-30" />
                <p className="font-mono text-payload-muted">No projects started yet</p>
              </div>
            ) : (
              memberDetail.projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-payload-surface border border-white/10 p-6 rounded-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-rajdhani font-bold text-xl uppercase text-payload-neon">
                      {project.business_name}
                    </h3>
                    <span className={`font-mono text-xs px-2 py-1 rounded-sm ${
                      project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'active' ? 'bg-payload-neon/20 text-payload-neon' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-payload-muted">PROGRESS</span>
                      <span className="font-mono text-sm text-white">{project.progress_percentage}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`}
                        style={{ width: `${project.progress_percentage}%` }}
                      />
                    </div>
                    <div className="font-mono text-xs text-payload-muted mt-1">
                      {project.completed_tasks} of {project.total_tasks} tasks completed
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    {project.tasks.sort((a, b) => a.order - b.order).map((task, idx) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-sm ${
                          task.status === 'completed' ? 'bg-green-500/10 border border-green-500/20' :
                          task.status === 'in_progress' ? 'bg-payload-cyan/10 border border-payload-cyan/20' :
                          'bg-black/20 border border-white/5'
                        }`}
                      >
                        {getTaskStatusIcon(task.status)}
                        <div className="flex-1">
                          <span className={`font-mono text-xs ${task.status === 'completed' ? 'text-green-400' : 'text-white'}`}>
                            {idx + 1}. {task.title}
                          </span>
                        </div>
                        <span className={`font-mono text-[10px] uppercase ${
                          task.status === 'completed' ? 'text-green-400' :
                          task.status === 'in_progress' ? 'text-payload-cyan' :
                          'text-payload-muted'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 font-mono text-xs text-payload-muted">
                    Started: {new Date(project.started_at).toLocaleDateString()}
                    {project.completed_at && (
                      <span className="ml-4">Completed: {new Date(project.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Members List View
  return (
    <div className="min-h-screen bg-payload-bg text-payload-text p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 border border-white/10 hover:border-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-payload-neon" />
            <div>
              <h1 className="font-rajdhani font-bold text-2xl sm:text-3xl uppercase tracking-wide">
                MEMBER PROGRESS
              </h1>
              <p className="font-mono text-sm text-payload-muted">
                Track project progress for all approved members
              </p>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid gap-4">
          {membersProgress.length === 0 ? (
            <div className="text-center py-12 bg-payload-surface border border-white/10 rounded-sm">
              <Users className="w-16 h-16 mx-auto mb-4 text-payload-muted opacity-30" />
              <p className="font-mono text-payload-muted">No approved members yet</p>
            </div>
          ) : (
            membersProgress.map((member) => (
              <div
                key={member.user_id}
                onClick={() => handleMemberClick(member)}
                className="bg-payload-surface border border-white/10 p-4 sm:p-6 rounded-sm cursor-pointer hover:border-payload-neon/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-rajdhani font-bold text-lg uppercase text-white truncate">
                        {member.user_name}
                      </h3>
                      <span className={`font-mono text-[10px] px-2 py-0.5 border rounded-sm ${getTierBadgeColor(member.tier)}`}>
                        {formatTierName(member.tier)}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-payload-muted truncate">{member.user_email}</p>
                  </div>

                  <div className="flex items-center gap-6 ml-4">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-mono text-lg text-payload-neon">{member.active_projects}</div>
                        <div className="font-mono text-[10px] text-payload-muted">ACTIVE</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-lg text-green-400">{member.completed_projects}</div>
                        <div className="font-mono text-[10px] text-payload-muted">DONE</div>
                      </div>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-14 h-14">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#00FF94"
                          strokeWidth="4"
                          strokeDasharray={`${member.overall_progress * 1.5} 150`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-xs text-payload-neon">{Math.round(member.overall_progress)}%</span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-payload-muted" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MemberProgressPage;
