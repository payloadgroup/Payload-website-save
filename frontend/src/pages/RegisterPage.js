import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Calendar, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState({ year: 2000, month: 0 });
  const [referredByLink, setReferredByLink] = useState(false);

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code: refCode }));
      setReferredByLink(true);
    }
  }, [searchParams]);

  const validateAustralianMobile = (mobile) => {
    const cleaned = mobile.replace(/[\s\-()]/g, '');
    // Australian mobile: +614XXXXXXXX or 04XXXXXXXX
    const ausPattern = /^(\+?61|0)4\d{8}$/;
    return ausPattern.test(cleaned);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const parseDOB = (dob) => {
    // Parse DD/MM/YYYY format
    const parts = dob.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const calculateAge = (dob) => {
    const birthDate = parseDOB(dob);
    if (!birthDate) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const convertToISO = (dob) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for backend
    const parts = dob.split('/');
    if (parts.length !== 3) return dob;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };

  const validateForm = () => {
    const newErrors = {};
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) newErrors.name = 'Please enter your first and last name';
    if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!validateAustralianMobile(formData.mobile)) newErrors.mobile = 'Please enter a valid Australian mobile (+61 4XX XXX XXX or 04XX XXX XXX)';
    if (formData.date_of_birth) {
      if (formData.date_of_birth.length !== 10 || !parseDOB(formData.date_of_birth)) {
        newErrors.date_of_birth = 'Please enter a valid date (DD/MM/YYYY)';
      } else {
        const age = calculateAge(formData.date_of_birth);
        if (age < 19) newErrors.date_of_birth = 'You must be at least 19 years old to apply';
      }
    } else {
      newErrors.date_of_birth = 'Please enter your date of birth';
    }
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const dobISO = convertToISO(formData.date_of_birth);
      await register(formData.name, formData.email, formData.password, formData.mobile, dobISO, formData.referral_code || null);
      toast.success('Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 19 - i);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const selectDate = (day) => {
    const dateStr = `${String(day).padStart(2, '0')}/${String(calendarDate.month + 1).padStart(2, '0')}/${calendarDate.year}`;
    setFormData({ ...formData, date_of_birth: dateStr });
    setShowCalendar(false);
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1711560707076-d50fbf8a3a26?crop=entropy&cs=srgb&fm=jpg&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 grid-bg opacity-50" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md mx-4">
        <button data-testid="back-to-home-btn" onClick={() => navigate('/')} className="flex items-center gap-2 font-mono text-sm text-payload-muted hover:text-payload-neon transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> BACK TO HOME
        </button>

        <div className="bg-payload-surface border border-white/10 p-8 rounded-sm">
          <h1 className="font-rajdhani font-bold text-4xl uppercase tracking-widest text-center mb-2">APPLY</h1>
          <p className="font-mono text-xs text-payload-muted text-center uppercase tracking-widest mb-8">REQUEST MEMBERSHIP ACCESS</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">FULL NAME (FIRST & LAST)</label>
              <input data-testid="register-name-input" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full bg-black border-b ${errors.name ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`} placeholder="John Commander" />
              {errors.name && <p className="text-red-500 text-xs font-mono mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">EMAIL</label>
              <input data-testid="register-email-input" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full bg-black border-b ${errors.email ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`} placeholder="agent@payload.com" />
              {errors.email && <p className="text-red-500 text-xs font-mono mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">MOBILE NUMBER (AUSTRALIA)</label>
              <input data-testid="register-mobile-input" type="tel" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className={`w-full bg-black border-b ${errors.mobile ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`} placeholder="+61 4XX XXX XXX" />
              {errors.mobile && <p className="text-red-500 text-xs font-mono mt-1">{errors.mobile}</p>}
            </div>

            <div className="relative">
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">DATE OF BIRTH</label>
              <div className="flex gap-2">
                <input data-testid="register-dob-input" type="text" inputMode="numeric" value={formData.date_of_birth} onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
                  if (value.length > 10) value = value.slice(0, 10);
                  setFormData({ ...formData, date_of_birth: value });
                }} className={`flex-1 bg-black border-b ${errors.date_of_birth ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`} placeholder="DD/MM/YYYY" />
                <button type="button" onClick={() => setShowCalendar(!showCalendar)} className="px-3 border border-white/20 hover:border-payload-neon text-payload-muted hover:text-payload-neon transition-colors">
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
              {errors.date_of_birth && <p className="text-red-500 text-xs font-mono mt-1">{errors.date_of_birth}</p>}
              <p className="text-payload-muted text-xs font-mono mt-1">Must be 19 years or older (DD/MM/YYYY)</p>

              {showCalendar && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-payload-surface border border-white/20 p-4 z-50 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <select value={calendarDate.month} onChange={(e) => setCalendarDate({ ...calendarDate, month: parseInt(e.target.value) })} className="bg-black border border-white/20 px-2 py-1 font-mono text-sm">
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={calendarDate.year} onChange={(e) => setCalendarDate({ ...calendarDate, year: parseInt(e.target.value) })} className="bg-black border border-white/20 px-2 py-1 font-mono text-sm">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-payload-muted py-1">{d}</div>)}
                    {Array.from({ length: new Date(calendarDate.year, calendarDate.month, 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: getDaysInMonth(calendarDate.year, calendarDate.month) }).map((_, i) => (
                      <button key={i + 1} type="button" onClick={() => selectDate(i + 1)} className="py-2 hover:bg-payload-neon hover:text-black transition-colors rounded-sm">{i + 1}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">PASSWORD</label>
              <div className="relative">
                <input data-testid="register-password-input" type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`w-full bg-black border-b ${errors.password ? 'border-red-500' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 pr-10 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors`} placeholder="Enter access code" />
                <button data-testid="toggle-password-visibility" type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-payload-muted hover:text-payload-neon transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs font-mono mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-payload-muted block mb-2">
                REFERRAL CODE {referredByLink ? <span className="text-payload-neon">(AUTO-FILLED FROM LINK)</span> : '(OPTIONAL)'}
              </label>
              <div className="relative">
                <input data-testid="register-referral-input" type="text" value={formData.referral_code} onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })} className={`w-full bg-black border-b ${referredByLink ? 'border-payload-neon/50' : 'border-white/20'} focus:border-payload-neon focus:outline-none py-3 px-0 font-mono text-payload-text placeholder:text-white/30 transition-colors ${referredByLink ? 'text-payload-neon' : ''}`} placeholder="REF-XXXX" readOnly={referredByLink} />
                {referredByLink && <UserPlus className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-payload-neon" />}
              </div>
              {referredByLink && <p className="text-payload-neon text-xs font-mono mt-1">You were referred by a Payload member!</p>}
            </div>

            <button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full font-rajdhani font-bold text-lg uppercase tracking-widest border-2 border-payload-neon text-payload-neon py-3 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-mono text-sm text-payload-muted">Already have access?{' '}<button data-testid="goto-login-btn" onClick={() => navigate('/login')} className="text-payload-neon hover:underline">Login here</button></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
