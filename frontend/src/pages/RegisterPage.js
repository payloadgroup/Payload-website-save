import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    date_of_birth: '',
    referral_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name has at least 2 words
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      newErrors.name = 'Please enter your first and last name';
    }
    
    // Validate age (must be 19+)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 19) {
        newErrors.date_of_birth = 'You must be at least 19 years old to apply';
      }
    }
    
    // Validate mobile number (basic check)
    if (formData.mobile && !/^[\d\s\-+()]{10,}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.mobile,
        formData.date_of_birth,
        formData.referral_code || null
      );
      toast.success('Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text flex items-center justify-center relative overflow-hidden py-12">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1711560707076-d50fbf8a3a26?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="absolute inset-0 grid-bg opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <button
          data-testid="back-to-home-btn"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-mono text-sm text-payload-muted hover:text-payload-neon transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO HOME
        </button>

        <div className="bg-payload-surface border border-white/10 p-8 rounded-sm">
          <h1 className="font-rajdhani font-bold text-4xl uppercase tracking-widest text-center mb-2">
            APPLY
          </h1>
          <p className="font-mono text-xs text-payload-muted text-center uppercase tracking-widest mb-8">
            REQUEST MEMBERSHIP ACCESS
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">
                FULL NAME (FIRST & LAST)
              </label>
              <input
                data-testid="register-name-input"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-black border-b ${errors.name ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`}
                placeholder="John Commander"
              />
              {errors.name && (
                <p className="text-red-500 text-xs font-mono mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">
                EMAIL
              </label>
              <input
                data-testid="register-email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors"
                placeholder="commander@payload.com"
              />
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  data-testid="register-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-3 pr-10 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors"
                  placeholder="Enter access code"
                />
                <button
                  data-testid="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-payload-muted hover:text-payload-neon transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">
                REFERRAL CODE (OPTIONAL)
              </label>
              <input
                data-testid="register-referral-input"
                type="text"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                className="w-full bg-black border-b border-white/20 focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors"
                placeholder="REF-XXXX"
              />
            </div>

            <button
              data-testid="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full font-rajdhani font-bold text-lg uppercase tracking-widest border-2 border-payload-neon text-payload-neon py-3 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-mono text-sm text-payload-muted">
              Already have access?{' '}
              <button
                data-testid="goto-login-btn"
                onClick={() => navigate('/login')}
                className="text-payload-neon hover:underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;