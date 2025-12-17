import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BankModal = ({ onClose, onUpdate }) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'deposit',
    amount: 0,
    description: '',
    category: 'general'
  });

  useEffect(() => {
    fetchTransactions();
    fetchBalance();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API}/bank/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction recorded');
      setFormData({ type: 'deposit', amount: 0, description: '', category: 'general' });
      setShowForm(false);
      fetchTransactions();
      fetchBalance();
      onUpdate();
    } catch (error) {
      toast.error('Failed to record transaction');
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
            <DollarSign className="w-6 h-6 text-payload-alert" />
            <h2 className="font-rajdhani font-bold text-2xl uppercase tracking-wide">BUSINESS BANK</h2>
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
          <div className="bg-black/50 border border-payload-alert/30 p-6 rounded-sm mb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2">CURRENT BALANCE</div>
            <div className="font-mono text-4xl text-payload-alert">${balance.toFixed(2)}</div>
          </div>

          {!showForm && (
            <button
              data-testid="add-transaction-btn"
              onClick={() => setShowForm(true)}
              className="w-full mb-6 font-mono text-sm border-2 border-dashed border-payload-alert text-payload-alert py-3 rounded-none hover:bg-payload-alert/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW TRANSACTION
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 p-6 rounded-sm mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">NEW TRANSACTION</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">TYPE</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black border border-white/20 text-payload-text py-2 px-2 rounded-none font-mono text-sm"
                    >
                      <option value="deposit">DEPOSIT</option>
                      <option value="withdrawal">WITHDRAWAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-2 block">AMOUNT</label>
                    <input
                      data-testid="transaction-amount-input"
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="w-full bg-black border border-white/20 focus:border-payload-alert focus:outline-none py-2 px-2 font-mono text-payload-text"
                    />
                  </div>
                </div>
                <input
                  data-testid="transaction-description-input"
                  type="text"
                  required
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-payload-alert focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-payload-alert focus:outline-none py-2 px-0 font-mono text-payload-text"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-transaction-btn"
                  type="submit"
                  className="flex-1 font-mono text-sm border border-payload-alert text-payload-alert py-2 rounded-none hover:bg-payload-alert hover:text-black transition-all"
                >
                  RECORD
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData({ type: 'deposit', amount: 0, description: '', category: 'general' }); }}
                  className="flex-1 font-mono text-sm border border-white/20 text-white py-2 rounded-none hover:bg-white/10 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-payload-muted mb-4">TRANSACTION HISTORY</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-payload-muted font-mono text-sm">
                NO TRANSACTIONS YET
              </div>
            ) : (
              transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  data-testid={`transaction-item-${index}`}
                  className="bg-black/30 border border-white/10 p-4 rounded-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-sm ${
                      transaction.type === 'deposit' ? 'bg-payload-neon/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className="w-5 h-5 text-payload-neon" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-payload-text">{transaction.description}</div>
                      <div className="font-mono text-xs text-payload-muted uppercase">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-lg ${
                      transaction.type === 'deposit' ? 'text-payload-neon' : 'text-red-500'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </div>
                    <div className="font-mono text-xs text-payload-muted">
                      Balance: ${transaction.balance_after.toFixed(2)}
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

export default BankModal;