import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Target, CheckCircle, Clock, Play, ChevronRight, ChevronLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemberMissionsModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async (projectId) => {
    try {
      const res = await axios.get(`${API}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    await fetchProjectTasks(project.id);
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await axios.put(`${API}/projects/tasks/${taskId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task updated');
      await fetchProjectTasks(selectedProject.id);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-payload-neon bg-payload-neon/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-payload-muted bg-white/10';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress': return <Play className="w-5 h-5 text-payload-cyan" />;
      default: return <Clock className="w-5 h-5 text-payload-muted" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (selectedProject) {
        setSelectedProject(null);
        setTasks([]);
      } else {
        onClose();
      }
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {selectedProject && (
              <button
                onClick={() => { setSelectedProject(null); setTasks([]); }}
                className="p-1 hover:bg-white/10 mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-payload-cyan flex-shrink-0" />
            <div>
              <h2 className="font-rajdhani font-bold text-lg sm:text-2xl uppercase tracking-wide">
                {selectedProject ? selectedProject.business_name : 'MISSIONS'}
              </h2>
              {!selectedProject && (
                <p className="font-mono text-[10px] text-payload-muted">
                  Track your project tasks & progress
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12 font-mono text-payload-muted">LOADING...</div>
          ) : selectedProject ? (
            // Task List View
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs text-payload-muted">PROGRESS</span>
                  <span className="font-mono text-sm text-payload-neon">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-payload-neon to-payload-cyan"
                  />
                </div>
                <div className="font-mono text-xs text-payload-muted mt-2">
                  {completedCount} of {tasks.length} tasks completed
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {tasks.sort((a, b) => a.order - b.order).map((task, index) => (
                  <div
                    key={task.id}
                    className={`bg-black/30 border ${task.status === 'completed' ? 'border-green-500/30' : 'border-white/10'} p-4 rounded-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTaskStatusIcon(task.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-payload-muted">TASK {index + 1}</span>
                          {task.status === 'completed' && task.completed_at && (
                            <span className="font-mono text-[10px] text-green-400">
                              ✓ {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className={`font-rajdhani font-bold text-base ${task.status === 'completed' ? 'text-green-400 line-through opacity-70' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        <p className="font-inter text-xs text-payload-muted mt-1">{task.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          disabled={updating === task.id}
                          className="bg-black border border-white/20 text-xs font-mono py-1 px-2 rounded-sm focus:outline-none focus:border-payload-neon disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Projects List View
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-payload-muted font-mono text-sm">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>NO ACTIVE MISSIONS</p>
                  <p className="text-xs mt-2">Start a project from HQ to see missions here</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="bg-black/30 border border-white/10 p-4 rounded-sm cursor-pointer hover:border-payload-cyan/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-rajdhani font-bold text-lg uppercase text-payload-cyan">
                        {project.business_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs px-2 py-1 rounded-sm uppercase ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-payload-muted" />
                      </div>
                    </div>
                    <div className="font-mono text-xs text-payload-muted">
                      Started: {new Date(project.started_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MemberMissionsModal;
