import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Rocket, Power, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemberProjectsModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(null);

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

  const handleDeactivate = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${projectName}"? This will remove it from your active projects.`)) {
      return;
    }
    
    setDeactivating(projectId);
    try {
      await axios.post(`${API}/projects/deactivate/${projectId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${projectName} deactivated`);
      await fetchProjects();
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to deactivate project');
    } finally {
      setDeactivating(null);
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-payload-neon flex-shrink-0" />
            <div>
              <h2 className="font-rajdhani font-bold text-lg sm:text-2xl uppercase tracking-wide">
                MY ACTIVE PROJECTS
              </h2>
              <p className="font-mono text-[10px] text-payload-muted">
                View tasks & progress in MISSIONS card
              </p>
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
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-payload-muted font-mono text-sm">
              <Rocket className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>NO ACTIVE PROJECTS</p>
              <p className="text-xs mt-2">Start a project from HQ to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-black/30 border border-white/10 p-4 rounded-sm hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-rajdhani font-bold text-lg uppercase text-payload-neon">
                          {project.business_name}
                        </h3>
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-sm uppercase ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs text-payload-muted">
                        <Calendar className="w-3 h-3" />
                        Started: {new Date(project.started_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivate(project.id, project.business_name)}
                      disabled={deactivating === project.id}
                      className="flex items-center gap-1 font-mono text-xs border border-red-500/50 text-red-400 px-3 py-2 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <Power className="w-3 h-3" />
                      {deactivating === project.id ? 'DEACTIVATING...' : 'DEACTIVATE'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MemberProjectsModal;
