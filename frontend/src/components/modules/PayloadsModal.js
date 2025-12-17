import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, Edit, Trash2, Rocket, Power, PowerOff } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PayloadsModal = ({ onClose, onUpdate }) => {
  const { token, user } = useAuth();
  const [payloads, setPayloads] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    funding_goal: 0,
    current_funding: 0,
    assigned_to: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchPayloads();
    if (isAdmin) {
      fetchMembers();
    }
  }, []);

  const fetchPayloads = async () => {
    try {
      const response = await axios.get(`${API}/payloads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayloads(response.data);
    } catch (error) {
      console.error('Failed to fetch payloads:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/admin/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/payloads/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Payload updated');
      } else {
        await axios.post(`${API}/payloads`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Payload assigned');
      }
      setFormData({ title: '', description: '', funding_goal: 0, current_funding: 0, assigned_to: '' });
      setEditingId(null);
      setShowForm(false);
      fetchPayloads();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save payload');
    }
  };

  const handleEdit = (payload) => {
    setFormData({
      title: payload.title,
      description: payload.description,
      funding_goal: payload.funding_goal,
      current_funding: payload.current_funding,
      assigned_to: payload.assigned_to
    });
    setEditingId(payload.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payload?')) {
      try {
        await axios.delete(`${API}/payloads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Payload deleted');
        fetchPayloads();
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete payload');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.post(`${API}/payloads/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payload activation toggled');
      fetchPayloads();
      onUpdate();
    } catch (error) {
      toast.error('Failed to toggle payload');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/payloads/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchPayloads();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getMemberName = (userId) => {
    const member = members.find(m => m.id === userId);
    return member ? member.name : 'Unknown';
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
            <Rocket className="w-6 h-6 text-payload-neon" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">
              {isAdmin ? 'PAYLOADS MANAGEMENT' : 'MY PAYLOADS'}
            </h2>
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
          {isAdmin && !showForm && (
            <button
              data-testid="add-payload-btn"
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-payload-neon text-payload-neon py-3 rounded-none hover:bg-payload-neon/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ASSIGN NEW PAYLOAD
            </button>
          )}

          {showForm && isAdmin && (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">
                {editingId ? 'EDIT PAYLOAD' : 'ASSIGN NEW PAYLOAD'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">ASSIGN TO MEMBER</label>
                  <select
                    required
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                    ))}
                  </select>
                </div>
                <input
                  data-testid="payload-title-input"
                  type="text"
                  required
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <textarea
                  data-testid="payload-description-input"
                  required
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-white/20 focus:border-payload-neon focus:outline-none py-2 px-3 font-mono text-payload-text resize-none"
                  rows="3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    data-testid="payload-goal-input"
                    type="number"
                    step="0.01"
                    placeholder="Funding Goal"
                    value={formData.funding_goal}
                    onChange={(e) => setFormData({ ...formData, funding_goal: parseFloat(e.target.value) })}
                    className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-2 px-0 font-mono text-payload-text"
                  />
                  <input
                    data-testid="payload-funding-input"
                    type="number"
                    step="0.01"
                    placeholder="Current Funding"
                    value={formData.current_funding}
                    onChange={(e) => setFormData({ ...formData, current_funding: parseFloat(e.target.value) })}
                    className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-2 px-0 font-mono text-payload-text"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-payload-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-payload-neon text-payload-neon py-2 rounded-none hover:bg-payload-neon hover:text-black transition-all"
                >
                  {editingId ? 'UPDATE' : 'ASSIGN'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', funding_goal: 0, current_funding: 0, assigned_to: '' }); }}
                  className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          {!isAdmin && payloads.length === 0 && (
            <div className="text-center py-12 text-payload-muted font-mono text-sm">
              <Rocket className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>NO PAYLOADS ASSIGNED YET</p>
              <p className="text-xs mt-2">Admin will assign payloads to you</p>
            </div>
          )}

          <div className="space-y-4">
            {payloads.length === 0 && isAdmin ? (
              <div className="text-center py-12 text-payload-muted font-mono text-sm">
                NO PAYLOADS CREATED YET
              </div>
            ) : (
              payloads.map((payload, index) => (
                <div
                  key={payload.id}
                  data-testid={`payload-item-${index}`}
                  className={`bg-black/30 border ${payload.is_active ? 'border-payload-neon/30' : 'border-white/10'} p-6 rounded-sm hover:border-white/20 transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide text-payload-neon">
                          {payload.title}
                        </h3>
                        {payload.is_active && (
                          <span className="font-mono text-xs bg-payload-neon/20 text-payload-neon px-2 py-1 rounded-sm">ACTIVE</span>
                        )}
                      </div>
                      {isAdmin && (
                        <p className="font-mono text-xs text-payload-muted mb-2">
                          ASSIGNED TO: {getMemberName(payload.assigned_to)}
                        </p>
                      )}
                      <p className="font-inter text-sm text-payload-text mb-4">{payload.description}</p>
                      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                        {isAdmin && (
                          <div>
                            <div className="text-payload-muted uppercase tracking-widest mb-1">STATUS</div>
                            <select
                              value={payload.status}
                              onChange={(e) => handleStatusChange(payload.id, e.target.value)}
                              className="bg-black border border-white/20 text-payload-neon py-1 px-2 rounded-none uppercase text-xs"
                            >
                              <option value="active">ACTIVE</option>
                              <option value="paused">PAUSED</option>
                              <option value="completed">COMPLETED</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">GOAL</div>
                          <div className="text-payload-alert">${payload.funding_goal.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-payload-muted uppercase tracking-widest mb-1">FUNDED</div>
                          <div className="text-payload-neon">${payload.current_funding.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleEdit(payload)}
                            className="p-2 hover:bg-white/10 rounded-none transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payload.id)}
                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-none transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          data-testid={`toggle-payload-${index}`}
                          onClick={() => handleToggleActive(payload.id)}
                          className={`p-2 rounded-none transition-all ${
                            payload.is_active 
                              ? 'bg-payload-neon/20 text-payload-neon hover:bg-payload-neon/30' 
                              : 'hover:bg-white/10 text-payload-muted'
                          }`}
                          title={payload.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {payload.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                        </button>
                      )}
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

export default PayloadsModal;
