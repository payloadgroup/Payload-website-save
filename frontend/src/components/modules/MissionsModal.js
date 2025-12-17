import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, Edit, Trash2, Target } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MissionsModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [missions, setMissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await axios.get(`${API}/missions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMissions(response.data);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/missions/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Mission updated');
      } else {
        await axios.post(`${API}/missions`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Mission created');
      }
      setFormData({ title: '', objective: '', priority: 'medium', due_date: '' });
      setEditingId(null);
      setShowForm(false);
      fetchMissions();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save mission');
    }
  };

  const handleEdit = (mission) => {
    setFormData({
      title: mission.title,
      objective: mission.objective,
      priority: mission.priority,
      due_date: mission.due_date || ''
    });
    setEditingId(mission.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this mission?')) {
      try {
        await axios.delete(`${API}/missions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Mission deleted');
        fetchMissions();
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete mission');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/missions/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchMissions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-payload-alert';
      case 'low': return 'text-payload-muted';
      default: return 'text-payload-text';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-payload-cyan" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">MISSIONS</h2>
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
          {!showForm && (
            <button
              data-testid="add-mission-btn"
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-payload-cyan text-payload-cyan py-3 rounded-none hover:bg-payload-cyan/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW MISSION
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">
                {editingId ? 'EDIT MISSION' : 'NEW MISSION'}
              </h3>
              <div className="space-y-4">
                <input
                  data-testid="mission-title-input"
                  type="text"
                  required
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-payload-cyan focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <textarea
                  data-testid="mission-objective-input"
                  required
                  placeholder="Objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full bg-black border border-white/20 focus:border-payload-cyan focus:outline-none py-2 px-3 font-mono text-payload-text resize-none"
                  rows="3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">PRIORITY</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">DUE DATE</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-mission-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-payload-cyan text-payload-cyan py-2 rounded-none hover:bg-payload-cyan hover:text-black transition-all"
                >
                  {editingId ? 'UPDATE' : 'CREATE'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', objective: '', priority: 'medium', due_date: '' }); }}
                  className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {missions.length === 0 ? (
              <div className="text-center py-12 text-payload-muted font-mono text-sm">
                NO MISSIONS YET
              </div>
            ) : (
              missions.map((mission, index) => (
                <div
                  key={mission.id}
                  data-testid={`mission-item-${index}`}
                  className="bg-black/30 border border-white/10 p-6 rounded-sm hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide text-payload-cyan mb-2">
                        {mission.title}
                      </h3>
                      <p className="font-inter text-sm text-payload-text mb-4">{mission.objective}</p>
                      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">STATUS</div>
                          <select
                            value={mission.status}
                            onChange={(e) => handleStatusChange(mission.id, e.target.value)}
                            className="bg-black border border-white/20 text-payload-cyan py-1 px-2 rounded-none uppercase text-xs"
                          >
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="completed">COMPLETED</option>
                            <option value="failed">FAILED</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">PRIORITY</div>
                          <div className={`uppercase ${getPriorityColor(mission.priority)}`}>{mission.priority}</div>
                        </div>
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">DUE DATE</div>
                          <div className="text-payload-text">{mission.due_date ? new Date(mission.due_date).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(mission)}
                        className="p-2 hover:bg-white/10 rounded-none transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mission.id)}
                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-none transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default MissionsModal;