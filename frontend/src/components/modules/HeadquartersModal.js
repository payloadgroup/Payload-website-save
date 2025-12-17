import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Building, Edit } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HeadquartersModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [headquarters, setHeadquarters] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchHeadquarters();
  }, []);

  const fetchHeadquarters = async () => {
    try {
      const response = await axios.get(`${API}/headquarters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setHeadquarters(response.data);
      } else {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Failed to fetch headquarters:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (headquarters) {
        await axios.put(`${API}/headquarters`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Headquarters updated');
      } else {
        await axios.post(`${API}/headquarters`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Headquarters established');
      }
      setShowForm(false);
      fetchHeadquarters();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save headquarters');
    }
  };

  const handleEdit = () => {
    setFormData({
      name: headquarters.name,
      location: headquarters.location,
      description: headquarters.description
    });
    setShowForm(true);
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
        className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-white" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">HEADQUARTERS</h2>
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
          {showForm ? (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">
                {headquarters ? 'EDIT HEADQUARTERS' : 'ESTABLISH HEADQUARTERS'}
              </h3>
              <div className="space-y-4">
                <input
                  data-testid="hq-name-input"
                  type="text"
                  required
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-white focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <input
                  data-testid="hq-location-input"
                  type="text"
                  required
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-white focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <textarea
                  data-testid="hq-description-input"
                  required
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-white/20 focus:border-white focus:outline-none py-2 px-3 font-mono text-payload-text resize-none"
                  rows="4"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-hq-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-white text-white py-2 rounded-none hover:bg-white hover:text-black transition-all"
                >
                  {headquarters ? 'UPDATE' : 'ESTABLISH'}
                </button>
                {headquarters && (
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormData({ name: '', location: '', description: '' }); }}
                    className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          ) : headquarters ? (
            <div className="bg-black/30 border border-white/10 p-6 rounded-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-rajdhani font-bold text-3xl uppercase tracking-wide text-white mb-4">
                    {headquarters.name}
                  </h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div>
                      <div className="text-payload-muted uppercase tracking-widest text-xs mb-1">LOCATION</div>
                      <div className="text-payload-text">{headquarters.location}</div>
                    </div>
                    <div>
                      <div className="text-payload-muted uppercase tracking-widest text-xs mb-1">DESCRIPTION</div>
                      <div className="text-payload-text">{headquarters.description}</div>
                    </div>
                    <div>
                      <div className="text-payload-muted uppercase tracking-widest text-xs mb-1">ESTABLISHED</div>
                      <div className="text-payload-text">{new Date(headquarters.established_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <button
                  data-testid="edit-hq-btn"
                  onClick={handleEdit}
                  className="p-2 hover:bg-white/10 rounded-none transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default HeadquartersModal;