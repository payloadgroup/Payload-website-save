const PayloadIcon = ({ variant = 'default', className = '' }) => {
  const icons = {
    // Simplified parachute icon for navigation
    parachute: (
      <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 C 7 3, 4 6, 4 9 L 6 9 L 6 8 L 8 8 L 8 9 L 10 9 L 10 8 L 14 8 L 14 9 L 16 9 L 16 8 L 18 8 L 18 9 L 20 9 C 20 6, 17 3, 12 3 Z" fill="currentColor"/>
        <line x1="6" y1="9" x2="10" y2="16" stroke="currentColor" strokeWidth="1"/>
        <line x1="12" y1="9" x2="12" y2="16" stroke="currentColor" strokeWidth="1"/>
        <line x1="18" y1="9" x2="14" y2="16" stroke="currentColor" strokeWidth="1"/>
        <rect x="10" y="16" width="4" height="4" fill="currentColor"/>
      </svg>
    ),
    // Box icon for payloads
    box: (
      <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="8" width="14" height="12" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="5" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
        <path d="M5 8 L12 4 L19 8" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
    // Airdrop icon for missions
    airdrop: (
      <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="12" y1="11" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 14 L12 20 L16 14" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
    // Default full logo
    default: (
      <svg className={`w-6 h-6 ${className}`} viewBox="0 0 40 40" fill="none">
        <path d="M20 5 C 12 5, 8 12, 8 17 L 12 17 L 12 15 L 15 15 L 15 17 L 18 17 L 18 15 L 22 15 L 22 17 L 25 17 L 25 15 L 28 15 L 28 17 L 32 17 C 32 12, 28 5, 20 5 Z" fill="currentColor"/>
        <line x1="10" y1="17" x2="16" y2="27" stroke="currentColor" strokeWidth="1"/>
        <line x1="20" y1="17" x2="20" y2="27" stroke="currentColor" strokeWidth="1"/>
        <line x1="30" y1="17" x2="24" y2="27" stroke="currentColor" strokeWidth="1"/>
        <rect x="16" y="27" width="8" height="7" fill="currentColor" className="opacity-80"/>
      </svg>
    )
  };

  return icons[variant] || icons.default;
};

export default PayloadIcon;