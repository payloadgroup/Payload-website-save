// PayloadIcon - Inline SVG icons based on the Payload logo
// Can be used like Lucide icons with size and className props

const PayloadIcon = ({ 
  variant = 'default', 
  size = 24,
  className = '',
  primaryColor = 'currentColor',
  accentColor = '#FFB000' // Yellow/gold for the payload box
}) => {
  const sizeClass = typeof size === 'number' ? '' : size;
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : {};

  const icons = {
    // Main logo - parachute with payload box (colored version)
    logo: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        {/* Parachute canopy */}
        <path 
          d="M12 2C7 2 4 5.5 4 9L6.5 9L6.5 7.5L8.5 7.5L8.5 9L10.5 9L10.5 7.5L13.5 7.5L13.5 9L15.5 9L15.5 7.5L17.5 7.5L17.5 9L20 9C20 5.5 17 2 12 2Z" 
          fill="#00FF94"
        />
        {/* Parachute lines */}
        <line x1="5.5" y1="9" x2="9" y2="14.5" stroke="#00FF94" strokeWidth="1" strokeLinecap="round"/>
        <line x1="9" y1="9" x2="10.5" y2="14.5" stroke="#00FF94" strokeWidth="1" strokeLinecap="round"/>
        <line x1="12" y1="9" x2="12" y2="14.5" stroke="#00FF94" strokeWidth="1" strokeLinecap="round"/>
        <line x1="15" y1="9" x2="13.5" y2="14.5" stroke="#00FF94" strokeWidth="1" strokeLinecap="round"/>
        <line x1="18.5" y1="9" x2="15" y2="14.5" stroke="#00FF94" strokeWidth="1" strokeLinecap="round"/>
        {/* Payload box */}
        <rect x="9" y="14.5" width="6" height="5" fill="#FFB000" rx="0.5"/>
        <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="#00FF94" strokeWidth="0.5" strokeOpacity="0.6"/>
        <line x1="12" y1="14.5" x2="12" y2="19.5" stroke="#00FF94" strokeWidth="0.5" strokeOpacity="0.6"/>
      </svg>
    ),

    // Simplified parachute icon (monochrome, good for buttons/nav)
    parachute: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 4 6 4 9L6 9L6 8L8 8L8 9L10 9L10 8L14 8L14 9L16 9L16 8L18 8L18 9L20 9C20 6 17 3 12 3Z" fill={primaryColor}/>
        <line x1="6" y1="9" x2="10" y2="16" stroke={primaryColor} strokeWidth="1"/>
        <line x1="12" y1="9" x2="12" y2="16" stroke={primaryColor} strokeWidth="1"/>
        <line x1="18" y1="9" x2="14" y2="16" stroke={primaryColor} strokeWidth="1"/>
        <rect x="10" y="16" width="4" height="4" fill={primaryColor}/>
      </svg>
    ),

    // Minimal parachute (outline style)
    minimal: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M4 10C4 6 7.5 3 12 3C16.5 3 20 6 20 10" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="10" x2="10" y2="17" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="10" x2="12" y2="17" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="10" x2="14" y2="17" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="9" y="17" width="6" height="4" stroke={primaryColor} strokeWidth="1.5" fill="none" rx="0.5"/>
      </svg>
    ),

    // Box/payload icon
    box: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="8" width="14" height="12" stroke={primaryColor} strokeWidth="2" fill="none"/>
        <line x1="5" y1="13" x2="19" y2="13" stroke={primaryColor} strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="20" stroke={primaryColor} strokeWidth="2"/>
        <path d="M5 8L12 4L19 8" stroke={primaryColor} strokeWidth="2" fill="none"/>
      </svg>
    ),

    // Airdrop/mission icon
    airdrop: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3" stroke={primaryColor} strokeWidth="2" fill="none"/>
        <line x1="12" y1="11" x2="12" y2="20" stroke={primaryColor} strokeWidth="2"/>
        <path d="M8 14L12 20L16 14" stroke={primaryColor} strokeWidth="2" fill="none"/>
      </svg>
    ),

    // Shield/secure icon with parachute
    shield: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6V11C4 16 7.5 20.5 12 22C16.5 20.5 20 16 20 11V6L12 2Z" stroke={primaryColor} strokeWidth="1.5" fill="none"/>
        <path d="M12 7C9.5 7 8 8.5 8 10L9.5 10L9.5 9.5L10.5 9.5L10.5 10L11.5 10L11.5 9.5L12.5 9.5L12.5 10L13.5 10L13.5 9.5L14.5 9.5L14.5 10L16 10C16 8.5 14.5 7 12 7Z" fill={primaryColor}/>
        <rect x="10" y="12" width="4" height="3" fill={primaryColor}/>
      </svg>
    ),

    // Default full logo (monochrome)
    default: (
      <svg style={sizeStyle} className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 2 4 5.5 4 9L6.5 9L6.5 7.5L8.5 7.5L8.5 9L10.5 9L10.5 7.5L13.5 7.5L13.5 9L15.5 9L15.5 7.5L17.5 7.5L17.5 9L20 9C20 5.5 17 2 12 2Z" fill={primaryColor}/>
        <line x1="5.5" y1="9" x2="9" y2="14.5" stroke={primaryColor} strokeWidth="1" strokeLinecap="round"/>
        <line x1="12" y1="9" x2="12" y2="14.5" stroke={primaryColor} strokeWidth="1" strokeLinecap="round"/>
        <line x1="18.5" y1="9" x2="15" y2="14.5" stroke={primaryColor} strokeWidth="1" strokeLinecap="round"/>
        <rect x="9" y="14.5" width="6" height="5" fill={primaryColor} opacity="0.85" rx="0.5"/>
      </svg>
    )
  };

  return icons[variant] || icons.default;
};

export default PayloadIcon;
