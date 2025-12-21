import PayloadIcon from '@/components/PayloadIcon';

const IconDemoPage = () => {
  const variants = ['logo', 'default', 'parachute', 'minimal', 'box', 'airdrop', 'shield'];
  const sizes = [16, 24, 32, 48, 64];

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text p-8">
      <h1 className="font-rajdhani font-bold text-4xl uppercase tracking-wide mb-2">PAYLOAD ICON VARIANTS</h1>
      <p className="font-mono text-sm text-payload-muted mb-12">Icons based on the Payload logo for use throughout the app</p>

      {/* Icon Variants */}
      <div className="space-y-12">
        {variants.map(variant => (
          <div key={variant} className="bg-payload-surface border border-white/10 p-6 rounded-sm">
            <h2 className="font-rajdhani font-bold text-xl uppercase mb-4 text-payload-neon">{variant}</h2>
            
            {/* Size variations */}
            <div className="flex items-end gap-8 mb-6">
              {sizes.map(size => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <PayloadIcon variant={variant} size={size} className="text-white" />
                  <span className="font-mono text-xs text-payload-muted">{size}px</span>
                </div>
              ))}
            </div>

            {/* Color variations */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
              <div className="flex flex-col items-center gap-2">
                <PayloadIcon variant={variant} size={32} className="text-white" />
                <span className="font-mono text-xs text-payload-muted">White</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PayloadIcon variant={variant} size={32} className="text-payload-neon" />
                <span className="font-mono text-xs text-payload-muted">Neon</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PayloadIcon variant={variant} size={32} className="text-payload-cyan" />
                <span className="font-mono text-xs text-payload-muted">Cyan</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PayloadIcon variant={variant} size={32} className="text-purple-400" />
                <span className="font-mono text-xs text-payload-muted">Purple</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PayloadIcon variant={variant} size={32} className="text-payload-alert" />
                <span className="font-mono text-xs text-payload-muted">Alert</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Examples */}
      <div className="mt-12 bg-payload-surface border border-payload-neon/30 p-6 rounded-sm">
        <h2 className="font-rajdhani font-bold text-xl uppercase mb-4 text-payload-neon">USAGE EXAMPLES</h2>
        
        <div className="space-y-4 font-mono text-sm">
          <div className="bg-black/50 p-4 rounded">
            <code className="text-payload-cyan">{'import PayloadIcon from "@/components/PayloadIcon";'}</code>
          </div>
          <div className="bg-black/50 p-4 rounded">
            <code className="text-white">{'<PayloadIcon variant="logo" size={24} />'}</code>
            <span className="text-payload-muted ml-4">// Full colored logo</span>
          </div>
          <div className="bg-black/50 p-4 rounded">
            <code className="text-white">{'<PayloadIcon variant="parachute" size={20} className="text-payload-neon" />'}</code>
          </div>
          <div className="bg-black/50 p-4 rounded">
            <code className="text-white">{'<PayloadIcon variant="minimal" size={32} />'}</code>
            <span className="text-payload-muted ml-4">// Outline style</span>
          </div>
        </div>
      </div>

      {/* Button Examples */}
      <div className="mt-8 bg-payload-surface border border-white/10 p-6 rounded-sm">
        <h2 className="font-rajdhani font-bold text-xl uppercase mb-4">IN BUTTONS</h2>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 bg-payload-neon text-black px-4 py-2 font-mono text-sm">
            <PayloadIcon variant="parachute" size={18} /> DEPLOY
          </button>
          <button className="flex items-center gap-2 border border-payload-neon text-payload-neon px-4 py-2 font-mono text-sm hover:bg-payload-neon/10">
            <PayloadIcon variant="box" size={18} /> PAYLOAD
          </button>
          <button className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 font-mono text-sm hover:border-white">
            <PayloadIcon variant="airdrop" size={18} /> MISSION
          </button>
          <button className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 px-4 py-2 font-mono text-sm">
            <PayloadIcon variant="shield" size={18} /> SECURE
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconDemoPage;
