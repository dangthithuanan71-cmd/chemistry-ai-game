import React from 'react';
import { motion } from 'motion/react';
import { Beaker } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryModuleProps {
  history: HistoryItem[];
  userUid: string;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({ history, userUid }) => {
  const userHistory = history.filter(h => h.studentUid === userUid);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight italic serif">My Lab History</h2>
        <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">{userHistory.length} Simulations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {userHistory.map((item) => (
          <div key={item.id}>
            <HistoryCard item={item} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <div className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-100 rounded">
          <Beaker className="w-5 h-5" />
        </div>
        <p className="text-[10px] text-gray-400 font-mono">{new Date(item.timestamp).toLocaleDateString()}</p>
      </div>
      <h3 className="font-mono text-sm font-bold mb-2 truncate">{item.chemicals}</h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-4 italic serif">"{item.result.educational_note}"</p>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${item.result.reaction_occurred ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {item.result.reaction_occurred ? 'Occurred' : 'No Reaction'}
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(lvl => (
            <div key={lvl} className={`w-2 h-1 rounded-full ${lvl <= item.result.danger_level ? 'bg-red-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
