import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Navigation, Clock, Phone, 
  Info, ChevronRight, Share2, Heart, 
  Coffee, Shield, Sparkles, Wifi 
} from 'lucide-react';

interface TaxiRank {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  routesServed: string[];
  hours: Record<string, string>;
  phone: string;
  facilities: Record<string, any>;
  distanceMeters?: number;
}

interface RankDetailPanelProps {
  rank: TaxiRank | null;
  onClose: () => void;
  onNavigate: (rank: TaxiRank) => void;
}

const RankDetailPanel: React.FC<RankDetailPanelProps> = ({ rank, onClose, onNavigate }) => {
  if (!rank) return null;

  const facilityIcons: Record<string, any> = {
    'wifi': <Wifi size={18} />,
    'restrooms': <Shield size={18} />,
    'shops': <Coffee size={18} />,
    'security': <Shield size={18} />,
    'default': <Sparkles size={18} />
  };

  return (
    <AnimatePresence>
      <motion.div
        key={rank.id}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl z-[2000] border-l border-white/20 dark:border-gray-800 flex flex-col pt-16 md:pt-0"
      >
        {/* Header Action Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500"
          >
            <X size={24} />
          </button>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500">
              <Share2 size={20} />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-red-500">
              <Heart size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Rank Title & Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded uppercase tracking-wider">
                {rank.district}
              </span>
              {rank.distanceMeters && (
                <span className="text-xs font-medium text-gray-500 underline decoration-blue-500/30">
                  {(rank.distanceMeters / 1000).toFixed(1)} km from you
                </span>
              )}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {rank.name}
            </h2>
            <div className="flex items-start gap-2 mt-3 text-gray-600 dark:text-gray-400">
              <MapPin size={18} className="mt-1 flex-shrink-0 text-blue-500" />
              <p className="text-sm">{rank.address}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate(rank)}
              className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              <Navigation size={20} />
              Directions
            </button>
            {rank.phone ? (
              <a 
                href={`tel:${rank.phone}`}
                className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-900 dark:text-white rounded-2xl font-bold border border-gray-100 dark:border-gray-700 transition active:scale-95"
              >
                <Phone size={20} />
                Call Rank
              </a>
            ) : (
              <button className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl font-bold border border-gray-100 dark:border-gray-700 cursor-not-allowed">
                <Info size={20} />
                No Info
              </button>
            )}
          </div>

          {/* Description Card */}
          {rank.description && (
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Info size={14} /> Overview
               </h3>
               <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                 {rank.description}
               </p>
            </div>
          )}

          {/* Destinations Served */}
          {rank.routesServed && rank.routesServed.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Destinations Served</h3>
              <div className="grid grid-cols-1 gap-2">
                {rank.routesServed.map((destination, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border border-transparent hover:border-blue-100 dark:hover:border-blue-800 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <MapPin size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {destination}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Facilities */}
          {rank.facilities && Object.keys(rank.facilities).length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">On-site Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(rank.facilities).map((key) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                    {facilityIcons[key.toLowerCase()] || facilityIcons.default}
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hours Card */}
          {rank.hours && Object.keys(rank.hours).length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} />
                Operating Hours
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-5 space-y-3">
                {Object.entries(rank.hours).map(([day, time]) => (
                  <div key={day} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${time.toLowerCase() === 'closed' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 lowercase capitalize">{day}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Floating Bottom Action (Safe area padding for mobile) */}
        <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-8 md:pb-4">
           <p className="text-[10px] text-center text-gray-400 mb-2 font-medium tracking-tight">
             Always verify route information with rank officials on-site.
           </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RankDetailPanel;
