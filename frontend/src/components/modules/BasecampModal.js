import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, BookOpen, FileText, Video, GraduationCap, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BasecampModal = ({ onClose }) => {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    url: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API}/basecamp`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(response.data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/basecamp`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource added');
      setFormData({ title: '', description: '', type: 'document', url: '' });
      setShowForm(false);
      fetchResources();
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'training':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">BASECAMP</h2>
          </div>
          <button
            data-testid="close-modal-btn"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {user?.role === 'admin' && !showForm && (
            <button
              data-testid="add-resource-btn"
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-white text-white py-3 rounded-none hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ADD RESOURCE
            </button>
          )}

          {showForm && user?.role === 'admin' && (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">NEW RESOURCE</h3>
              <div className="space-y-4">
                <input
                  data-testid="resource-title-input"
                  type="text"
                  required
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-white focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <textarea
                  data-testid="resource-description-input"
                  required
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-white/20 focus:border-white focus:outline-none py-2 px-3 font-mono text-payload-text resize-none"
                  rows="3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">TYPE</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                    >
                      <option value="document">DOCUMENT</option>
                      <option value="video">VIDEO</option>
                      <option value="training">TRAINING</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">URL</label>
                    <input
                      data-testid="resource-url-input"
                      type="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full bg-black border border-white/20 focus:border-white focus:outline-none py-2 px-2 font-mono text-payload-text"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-resource-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-white text-white py-2 rounded-none hover:bg-white hover:text-black transition-all"
                >
                  ADD
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData({ title: '', description: '', type: 'document', url: '' }); }}
                  className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {resources.length === 0 ? (
              <div className="text-center py-12 text-payload-muted font-mono text-sm">
                NO RESOURCES AVAILABLE
              </div>
            ) : (
              resources.map((resource, index) => (
                <div
                  key={resource.id}
                  data-testid={`resource-item-${index}`}
                  className="bg-black/30 border border-white/10 p-6 rounded-sm hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="p-3 bg-white/5 rounded-sm">
                        {getIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide text-white mb-2">
                          {resource.title}
                        </h3>
                        <p className="font-inter text-sm text-payload-text mb-3">{resource.description}</p>
                        <div className="flex items-center gap-4 font-mono text-xs">
                          <div>
                            <span className="text-payload-muted uppercase tracking-widest">TYPE: </span>
                            <span className="text-payload-neon uppercase">{resource.type}</span>
                          </div>
                          <div>
                            <span className="text-payload-muted uppercase tracking-widest">ADDED: </span>
                            <span className="text-payload-text">{new Date(resource.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-none transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BasecampModal;