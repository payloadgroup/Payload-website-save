import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Beaker, Sun, Building2, Home, Repeat, Snowflake, Coins, Truck, Flame, X, Lock } from 'lucide-react';
import PayloadLogo from '@/components/PayloadLogo';

// Tier unlock configuration - which rooms are unlocked at each tier
const TIER_UNLOCK_MAP = {
  'junior_recruit': [1, 2, 3],
  'front_line': [1, 2, 3, 4],
  'mid_level_manager': [1, 2, 3, 4, 5],
  'senior_manager': [1, 2, 3, 4, 5, 6, 7],
  'top_leadership': [1, 2, 3, 4, 5, 6, 7, 8]
};

// Tier labels for display
const TIER_LABELS = {
  'junior_recruit': 'JUNIOR RECRUIT',
  'front_line': 'FRONT-LINE',
  'mid_level_manager': 'MID-LEVEL MANAGER',
  'senior_manager': 'SENIOR MANAGER',
  'top_leadership': 'TOP LEADERSHIP'
};

// Which tier unlocks each room
const ROOM_UNLOCK_TIER = {
  1: 'junior_recruit',
  2: 'junior_recruit',
  3: 'junior_recruit',
  4: 'front_line',
  5: 'mid_level_manager',
  6: 'senior_manager',
  7: 'senior_manager',
  8: 'top_leadership'
};

const ROOMS = [
  {
    id: 1,
    name: 'Censored Referrals',
    type: 'OPERATIONAL',
    icon: Home,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    description: 'Member referral tracking and social media content guidance program.',
    focus: 'Grow the community through referrals and boost your member tier.',
    details: null
  },
  {
    id: 2,
    name: 'Guaranteed Flips',
    type: 'OPERATIONAL',
    icon: Repeat,
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    description: 'Sourcing and executing on unique property deal opportunities brought by members with exclusive market positioning.',
    focus: null,
    details: null
  },
  {
    id: 3,
    name: 'SolarHex',
    type: 'R&D',
    icon: Sun,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    description: 'Financing and developing solar units to power cryptocurrency mining operations.',
    focus: 'A fluid dynamic rental system for solar infrastructure.',
    details: {
      leverage: 'Utilizes instant asset write-off for assets under $20k, plus the Small Business Energy Incentive.',
      example: 'A $20k generator qualifies for the full instant write-off, plus a potential 20% bonus deduction.',
      mining: 'Will utilize solo mining via CKPOOL.',
      rdActivities: [
        'Designing innovative solar panel configurations to improve energy capture.',
        'Engaging subcontractors for specialized R&D work.'
      ]
    }
  },
  {
    id: 4,
    name: 'Iceberg Technologies',
    type: 'R&D',
    icon: Snowflake,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    description: 'Property development focused on building downwards to create new square footage where above-ground expansion is restricted by regulations.',
    focus: 'We engage only in highly attractive, unique opportunities.',
    details: {
      rdActivities: [
        'Developing new construction methods to meet strict regulatory or environmental standards through technical experimentation.'
      ]
    }
  },
  {
    id: 5,
    name: 'CPDD',
    type: 'OPERATIONAL',
    icon: Truck,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    description: 'Care Package Dispatch & Delivery',
    focus: 'Operates as an Amazon Delivery Service Partner (DSP).',
    details: null
  },
  {
    id: 6,
    name: 'Payload Fintech',
    type: 'R&D',
    icon: Coins,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    description: 'An ecosystem connecting investors and companies for non-equity financing.',
    focus: 'No fixed contractual returns. Instead, ROI is based on a company\'s transparent, historical track record of returns to investors—similar to blockchain\'s public ledger.',
    details: {
      function: 'Investors choose companies based on displayed merits and verifiable past performance (e.g., "Company X has historically delivered average returns of 20%").'
    }
  },
  {
    id: 7,
    name: 'Paybond',
    type: 'R&D',
    icon: Beaker,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    description: 'A bond-based business structured by using our members as guarantors.',
    focus: 'Development of the underlying technology platform.',
    details: null
  },
  {
    id: 8,
    name: 'H2 Green Production',
    type: 'FUTURE',
    icon: Flame,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    description: 'Hydrogen production with a target production cost of $2 per kg.',
    focus: 'Leveraging applicable cash incentives. Launch: Post-June 2026.',
    details: null
  }
];

const HeadquartersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Get unlocked rooms based on user tier (admin sees all)
  const userTier = user?.tier || 'junior_recruit';
  const isAdmin = user?.role === 'admin';
  const unlockedRooms = isAdmin ? [1, 2, 3, 4, 5, 6, 7, 8] : (TIER_UNLOCK_MAP[userTier] || [1, 2, 3]);

  const isRoomUnlocked = (roomId) => unlockedRooms.includes(roomId);

  const getRequiredTierForRoom = (roomId) => {
    const tier = ROOM_UNLOCK_TIER[roomId];
    return TIER_LABELS[tier] || 'UNKNOWN';
  };

  const handleRoomClick = (room) => {
    if (isRoomUnlocked(room.id)) {
      // Guaranteed Flips navigates to its dedicated page
      if (room.name === 'Guaranteed Flips') {
        navigate('/guaranteed-flips');
      } else {
        setSelectedRoom(room);
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'R&D': return 'text-purple-400 bg-purple-500/20';
      case 'OPERATIONAL': return 'text-blue-400 bg-blue-500/20';
      case 'FUTURE': return 'text-emerald-400 bg-emerald-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-payload-bg text-payload-text">
      {/* Navigation */}
      <nav className="border-b border-payload-border bg-payload-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <PayloadLogo size="default" />
              <div className="font-rajdhani font-bold text-xl sm:text-2xl tracking-widest text-payload-neon">
                PAYLOAD
              </div>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm border border-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-none hover:border-white hover:bg-white/5 transition-all duration-300 w-fit"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>DASHBOARD</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="font-rajdhani font-bold text-2xl sm:text-4xl uppercase tracking-wide mb-2">
              HEADQUARTERS
            </h1>
            <p className="font-mono text-xs sm:text-sm text-payload-muted uppercase tracking-widest">
              OPERATIONS & R&D ROOMS
            </p>
          </div>

          {/* Room Type Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {['R&D', 'OPERATIONAL', 'FUTURE'].map(type => (
              <span key={type} className={`font-mono text-xs px-3 py-1 rounded-sm ${getTypeColor(type)}`}>
                {type}
              </span>
            ))}
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ROOMS.map((room, index) => {
              const unlocked = isRoomUnlocked(room.id);
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRoomClick(room)}
                  className={`relative bg-payload-surface border ${room.borderColor} p-4 sm:p-5 rounded-sm transition-all duration-200 ${
                    unlocked 
                      ? `cursor-pointer hover:scale-[1.02] ${room.bgColor}` 
                      : 'cursor-not-allowed opacity-60 grayscale'
                  }`}
                >
                  {/* Lock Overlay for locked rooms */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-sm">
                      <Lock className="w-8 h-8 text-payload-muted mb-2" />
                      <span className="font-mono text-[10px] text-payload-muted text-center px-2">
                        REQUIRES {getRequiredTierForRoom(room.id)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <room.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${room.color}`} />
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-sm ${getTypeColor(room.type)}`}>
                      {room.type}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-payload-muted mb-1">ROOM {room.id}</div>
                  <h3 className="font-rajdhani font-bold text-base sm:text-lg uppercase tracking-wide mb-2 line-clamp-1">
                    {room.name}
                  </h3>
                  <p className="font-inter text-xs text-payload-muted line-clamp-2">
                    {room.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedRoom(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-payload-surface border ${selectedRoom.borderColor} rounded-sm w-full max-w-2xl max-h-[90vh] overflow-hidden ${selectedRoom.bgColor}`}
          >
            <div className="border-b border-white/10 p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <selectedRoom.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${selectedRoom.color}`} />
                <div>
                  <div className="font-mono text-[10px] text-payload-muted">ROOM {selectedRoom.id}</div>
                  <h2 className="font-rajdhani font-bold text-xl sm:text-2xl uppercase tracking-wide">
                    {selectedRoom.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-2 hover:bg-white/10 rounded-none transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <span className={`font-mono text-xs px-3 py-1 rounded-sm ${getTypeColor(selectedRoom.type)} inline-block mb-4`}>
                {selectedRoom.type} PROJECT
              </span>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-xs text-payload-muted uppercase tracking-widest mb-1">CORE CONCEPT</div>
                  <p className="font-inter text-sm text-payload-text">{selectedRoom.description}</p>
                </div>

                {selectedRoom.focus && (
                  <div>
                    <div className="font-mono text-xs text-payload-muted uppercase tracking-widest mb-1">FOCUS</div>
                    <p className="font-inter text-sm text-payload-text">{selectedRoom.focus}</p>
                  </div>
                )}

                {selectedRoom.details && (
                  <>
                    {selectedRoom.details.leverage && (
                      <div>
                        <div className="font-mono text-xs text-payload-muted uppercase tracking-widest mb-1">FINANCIAL LEVERAGE</div>
                        <p className="font-inter text-sm text-payload-text">{selectedRoom.details.leverage}</p>
                      </div>
                    )}

                    {selectedRoom.details.example && (
                      <div className="bg-black/30 border border-white/10 p-3 rounded-sm">
                        <div className="font-mono text-xs text-payload-neon uppercase mb-1">EXAMPLE</div>
                        <p className="font-inter text-sm text-payload-text">{selectedRoom.details.example}</p>
                      </div>
                    )}

                    {selectedRoom.details.mining && (
                      <div>
                        <div className="font-mono text-xs text-payload-muted uppercase tracking-widest mb-1">MINING OPERATION</div>
                        <p className="font-inter text-sm text-payload-text">{selectedRoom.details.mining}</p>
                      </div>
                    )}

                    {selectedRoom.details.function && (
                      <div>
                        <div className="font-mono text-xs text-payload-muted uppercase tracking-widest mb-1">FUNCTION</div>
                        <p className="font-inter text-sm text-payload-text">{selectedRoom.details.function}</p>
                      </div>
                    )}

                    {selectedRoom.details.rdActivities && selectedRoom.details.rdActivities.length > 0 && (
                      <div>
                        <div className="font-mono text-xs text-purple-400 uppercase tracking-widest mb-2">ELIGIBLE R&D ACTIVITIES</div>
                        <ul className="space-y-2">
                          {selectedRoom.details.rdActivities.map((activity, i) => (
                            <li key={i} className="flex gap-2 font-inter text-sm text-payload-text">
                              <span className="text-purple-400">•</span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HeadquartersPage;
