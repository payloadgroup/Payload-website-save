import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, Edit, Trash2, MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StationsModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [stations, setStations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'office',
    description: ''
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await axios.get(`${API}/stations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStations(response.data);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/stations/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Station updated');
      } else {
        await axios.post(`${API}/stations`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Station created');
      }
      setFormData({ name: '', location: '', type: 'office', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchStations();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save station');
    }
  };

  const handleEdit = (station) => {
    setFormData({
      name: station.name,
      location: station.location,
      type: station.type,
      description: station.description
    });
    setEditingId(station.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this station?')) {
      try {
        await axios.delete(`${API}/stations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Station deleted');
        fetchStations();
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete station');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/stations/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchStations();
    } catch (error) {
      toast.error('Failed to update status');
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
            <MapPin className="w-6 h-6 text-white" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">STATIONS</h2>
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
              data-testid="add-station-btn"
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-white text-white py-3 rounded-none hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW STATION
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">
                {editingId ? 'EDIT STATION' : 'NEW STATION'}
              </h3>
              <div className="space-y-4">
                <input
                  data-testid="station-name-input"
                  type="text"
                  required
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-white focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <input
                  data-testid="station-location-input"
                  type="text"
                  required
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-white focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">TYPE</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                  >
                    <option value="office">OFFICE</option>
                    <option value="partnership">PARTNERSHIP</option>
                    <option value="franchise">FRANCHISE</option>
                    <option value="warehouse">WAREHOUSE</option>
                    <option value="retail">RETAIL</option>
                  </select>
                </div>
                <textarea
                  data-testid="station-description-input"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-white/20 focus:border-white focus:outline-none py-2 px-3 font-mono text-payload-text resize-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-station-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-white text-white py-2 rounded-none hover:bg-white hover:text-black transition-all"
                >
                  {editingId ? 'UPDATE' : 'CREATE'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setFormData({ name: '', location: '', type: 'office', description: '' }); }}
                  className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {stations.length === 0 ? (
              <div className="text-center py-12 text-payload-muted font-mono text-sm">
                NO STATIONS YET
              </div>
            ) : (
              stations.map((station, index) => (
                <div
                  key={station.id}
                  data-testid={`station-item-${index}`}
                  className="bg-black/30 border border-white/10 p-6 rounded-sm hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide text-white mb-2">
                        {station.name}
                      </h3>
                      <p className="font-inter text-sm text-payload-muted mb-1">{station.location}</p>
                      {station.description && (
                        <p className="font-inter text-sm text-payload-text mb-4">{station.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">TYPE</div>
                          <div className="text-white uppercase">{station.type}</div>
                        </div>
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">STATUS</div>
                          <select
                            value={station.status}
                            onChange={(e) => handleStatusChange(station.id, e.target.value)}
                            className="bg-black border border-white/20 text-payload-neon py-1 px-2 rounded-none uppercase text-xs"
                          >
                            <option value="active">ACTIVE</option>
                            <option value="inactive">INACTIVE</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">ESTABLISHED</div>
                          <div className="text-white">{new Date(station.established_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(station)}
                        className="p-2 hover:bg-white/10 rounded-none transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(station.id)}
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

export default StationsModal;