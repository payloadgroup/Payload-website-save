const PayloadLogo = ({ size = 'default', className = '' }) => {
  const sizes = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-24 h-24',
    hero: 'w-40 h-40'
  };

  return (
    <img 
      src="/payload-logo.png"
      alt="Payload Logo"
      className={`${sizes[size]} object-contain ${className}`}
    />
  );
};

export default PayloadLogo;