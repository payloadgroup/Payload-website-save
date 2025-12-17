import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Users, Target, Zap } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';
import PayloadIcon from '@/components/PayloadIcon';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text grid-bg">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1581986358940-80f75484cf09?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)'
        }}
      />
      
      <div className="relative z-10">
        <nav className="border-b border-white/10 bg-payload-surface/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <button
              data-testid="logo-home-btn"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">
                PAYLOAD
              </div>
            </button>
            <div className="flex gap-2 sm:gap-4">
              <button
                data-testid="nav-login-btn"
                onClick={() => navigate('/login')}
                className="font-mono text-xs sm:text-sm border border-white/20 px-4 sm:px-6 py-1.5 sm:py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300"
              >
                LOGIN
              </button>
            </div>
          </div>
        </nav>

        <section className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="flex justify-center mb-8">
              <PayloadLogo size="hero" className="animate-pulse" />
            </div>
            <h1 className="font-rajdhani font-bold text-5xl sm:text-6xl lg:text-7xl uppercase tracking-wide mb-6">
              PAYLOAD
            </h1>
            <p className="font-rajdhani text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider text-payload-neon mb-8">
              Command Your Business Universe
            </p>
            <p className="font-inter text-lg text-payload-muted max-w-2xl mx-auto mb-12">
              An exclusive private members club for entrepreneurs, investors, and innovators. 
              Join the mission control center where business leaders orchestrate their ventures.
            </p>
            <button
              data-testid="hero-apply-btn"
              onClick={() => navigate('/register')}
              className="font-rajdhani font-bold text-lg uppercase tracking-widest border-2 border-payload-neon text-payload-neon px-12 py-4 rounded-none hover:bg-payload-neon hover:text-black transition-all duration-300 glow-effect"
            >
              Apply for Membership
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            <div className="bg-payload-surface border border-white/10 p-8 rounded-sm hover:border-payload-neon/50 transition-all duration-300">
              <div className="mb-4">
                <PayloadIcon variant="box" className="w-12 h-12 text-payload-neon" />
              </div>
              <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-3">PAYLOADS</h3>
              <p className="font-inter text-sm text-payload-muted">Launch and manage your business ventures with precision</p>
            </div>
            
            <div className="bg-payload-surface border border-white/10 p-8 rounded-sm hover:border-payload-neon/50 transition-all duration-300">
              <div className="mb-4">
                <PayloadIcon variant="airdrop" className="w-12 h-12 text-payload-cyan" />
              </div>
              <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-3">MISSIONS</h3>
              <p className="font-inter text-sm text-payload-muted">Execute strategic objectives and track your progress</p>
            </div>
            
            <div className="bg-payload-surface border border-white/10 p-8 rounded-sm hover:border-payload-neon/50 transition-all duration-300">
              <Users className="w-12 h-12 text-payload-alert mb-4" />
              <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-3">NETWORK</h3>
              <p className="font-inter text-sm text-payload-muted">Connect with elite entrepreneurs and investors</p>
            </div>
            
            <div className="bg-payload-surface border border-white/10 p-8 rounded-sm hover:border-payload-neon/50 transition-all duration-300">
              <div className="mb-4">
                <PayloadIcon variant="parachute" className="w-12 h-12 text-payload-neon" />
              </div>
              <h3 className="font-rajdhani font-bold text-xl uppercase tracking-wide mb-3">COMMAND</h3>
              <p className="font-inter text-sm text-payload-muted">Take control from your personal mission control center</p>
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-white/10 bg-payload-surface/80 backdrop-blur-sm mt-32">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="font-mono text-sm text-payload-muted">
                © 2025 PAYLOAD. All systems operational.
              </div>
              <div className="flex gap-8 font-mono text-sm">
                <button className="text-payload-muted hover:text-payload-neon transition-colors">About</button>
                <button className="text-payload-muted hover:text-payload-neon transition-colors">Privacy Policy</button>
                <button className="text-payload-muted hover:text-payload-neon transition-colors">Contact</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;