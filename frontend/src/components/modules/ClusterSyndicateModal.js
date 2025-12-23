import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Users, DollarSign, ChevronDown, ChevronUp, Edit, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClusterSyndicateModal = ({ onClose, onUpdate, isAdmin }) => {
  const { token } = useAuth();
  const [clusterData, setClusterData] = useState({ clusters: [], total_capital: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [clusterMembers, setClusterMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchClusterData();
  }, []);

  const fetchClusterData = async () => {
    try {
      const response = await axios.get(`${API}/funding/cluster/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClusterData(response.data);
    } catch (error) {
      console.error('Failed to fetch cluster data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClusterMembers = async (businessType) => {
    setLoadingMembers(true);
    try {
      const response = await axios.get(`${API}/funding/cluster/${businessType}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClusterMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch cluster members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleExpandCluster = async (cluster) => {
    if (expandedCluster === cluster.business_type) {
      setExpandedCluster(null);
      setClusterMembers([]);
    } else {
      setExpandedCluster(cluster.business_type);
      if (isAdmin) {
        await fetchClusterMembers(cluster.business_type);
      }
    }
  };

  const handleSaveValue = async (businessType, userId) => {
    try {
      await axios.put(
        `${API}/funding/cluster/${businessType}/member/${userId}/value`,
        { value: parseFloat(editValue) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Value updated');
      setEditingValue(null);
      setEditValue('');
      await fetchClusterMembers(businessType);
      await fetchClusterData();
      onUpdate();
    } catch (error) {
      toast.error('Failed to update value');
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
        className="bg-payload-surface border border-white/20 rounded-sm w-full max-w-3xl max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="font-rajdhani font-bold text-xl sm:text-2xl uppercase tracking-wide">
                CLUSTER SYNDICATE
              </h2>
              <p className="font-mono text-xs text-payload-muted">
                Members participating in same projects
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
          {/* Total Capital Banner */}
          <div className="bg-payload-alert/10 border border-payload-alert/30 p-4 rounded-sm mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-payload-alert" />
              <div>
                <div className="font-mono text-xs text-payload-muted">TOTAL CAPITAL</div>
                <div className="font-rajdhani font-bold text-2xl text-payload-alert">
                  ${clusterData.total_capital.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 font-mono text-payload-muted">LOADING...</div>
          ) : clusterData.clusters.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-payload-muted opacity-30" />
              <p className="font-mono text-payload-muted">NO ACTIVE CLUSTERS</p>
              <p className="font-mono text-xs text-payload-muted mt-2">
                Members need to start projects from HQ
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clusterData.clusters.map((cluster) => (
                <div key={cluster.business_type} className="bg-black/30 border border-white/10 rounded-sm overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5"
                    onClick={() => handleExpandCluster(cluster)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-rajdhani font-bold text-lg uppercase text-purple-400">
                          {cluster.business_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="font-mono text-xs text-payload-muted">
                            <Users className="w-3 h-3 inline mr-1" />
                            {cluster.member_count} member{cluster.member_count !== 1 ? 's' : ''}
                          </span>
                          <span className="font-mono text-xs text-payload-alert">
                            <DollarSign className="w-3 h-3 inline" />
                            {cluster.capital.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {expandedCluster === cluster.business_type ? (
                        <ChevronUp className="w-5 h-5 text-payload-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-payload-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Member List (Admin Only) */}
                  <AnimatePresence>
                    {expandedCluster === cluster.business_type && isAdmin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-2">
                          {loadingMembers ? (
                            <div className="text-center py-4 font-mono text-xs text-payload-muted">LOADING...</div>
                          ) : clusterMembers.length === 0 ? (
                            <div className="text-center py-4 font-mono text-xs text-payload-muted">NO MEMBERS</div>
                          ) : (
                            clusterMembers.map((member) => (
                              <div 
                                key={member.user_id} 
                                className="flex items-center justify-between bg-black/20 p-3 rounded-sm"
                              >
                                <div>
                                  <div className="font-mono text-sm">{member.user_name}</div>
                                  <div className="font-mono text-[10px] text-payload-muted">{member.user_email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {editingValue === member.user_id ? (
                                    <>
                                      <span className="font-mono text-sm text-payload-alert">$</span>
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-24 bg-black border border-payload-alert/50 px-2 py-1 font-mono text-sm focus:outline-none focus:border-payload-alert"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveValue(cluster.business_type, member.user_id)}
                                        className="p-1 bg-payload-neon/20 text-payload-neon hover:bg-payload-neon/30"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => { setEditingValue(null); setEditValue(''); }}
                                        className="p-1 bg-white/10 hover:bg-white/20"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-mono text-sm text-payload-alert">
                                        ${member.value.toLocaleString()}
                                      </span>
                                      <button
                                        onClick={() => { setEditingValue(member.user_id); setEditValue(member.value.toString()); }}
                                        className="p-1 hover:bg-white/10"
                                      >
                                        <Edit className="w-4 h-4 text-payload-muted" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Non-Admin: Just show member count info */}
                  <AnimatePresence>
                    {expandedCluster === cluster.business_type && !isAdmin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 text-center">
                          <p className="font-mono text-sm text-payload-muted">
                            {cluster.member_count} member{cluster.member_count !== 1 ? 's' : ''} are participating in this project
                          </p>
                          <p className="font-mono text-xs text-payload-alert mt-2">
                            Estimated Capital: ${cluster.capital.toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ClusterSyndicateModal;
