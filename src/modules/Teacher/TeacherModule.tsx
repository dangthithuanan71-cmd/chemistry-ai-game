import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { HistoryItem } from '../../types';

interface TeacherModuleProps {
  history: HistoryItem[];
}

export const TeacherModule: React.FC<TeacherModuleProps> = ({ history }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic serif">Teacher Dashboard</h2>
          <p className="text-sm text-gray-500">Monitoring all student activity</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border border-[#141414] px-4 py-2 rounded flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Filter by student..." className="outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-[#141414] overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-white text-[10px] uppercase tracking-widest">
              <th className="p-4">Student</th>
              <th className="p-4">Reaction</th>
              <th className="p-4">Result</th>
              <th className="p-4">Danger</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-sm">{item.studentEmail}</p>
                  <p className="text-[10px] text-gray-400 uppercase">{item.studentUid.slice(0, 8)}</p>
                </td>
                <td className="p-4 font-mono text-xs">{item.chemicals}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.result.reaction_occurred ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.result.reaction_occurred ? 'Success' : 'No Reaction'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`w-2 h-1 rounded-full ${lvl <= item.result.danger_level ? 'bg-red-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
