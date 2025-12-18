import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Lock, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SettingsDropdown = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: 'Profile', action: () => navigate('/profile') },
    { icon: Lock, label: 'Account', action: () => navigate('/account') },
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: HelpCircle, label: 'Help & Support', action: () => window.open('mailto:support@payload.com') },
    { divider: true },
    { icon: LogOut, label: 'Logout', action: () => { logout(); navigate('/login'); }, danger: true }
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 p-2 hover:bg-white/10 rounded-sm transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5 text-payload-muted hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-payload-surface border border-white/20 rounded-sm shadow-xl z-50">
          {menuItems.map((item, index) => (
            item.divider ? (
              <div key={index} className="border-t border-white/10 my-1" />
            ) : (
              <button
                key={index}
                onClick={() => { item.action(); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase tracking-wider hover:bg-white/10 transition-colors ${
                  item.danger ? 'text-red-500 hover:text-red-400' : 'text-payload-text hover:text-payload-neon'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
