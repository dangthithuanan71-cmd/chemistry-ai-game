import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, FlaskConical, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ReactionResult } from '../../types';

interface LabModuleProps {
  chemicals: string;
  setChemicals: (val: string) => void;
  simulateReaction: () => Promise<void>;
  isSimulating: boolean;
  result: ReactionResult | null;
}

export const LabModule: React.FC<LabModuleProps> = ({
  chemicals,
  setChemicals,
  simulateReaction,
  isSimulating,
  result
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Lab Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 italic serif">
            <FlaskConical className="w-5 h-5" />
            Reaction Input
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Enter Chemicals (e.g., HCl + NaOH)</label>
              <textarea 
                value={chemicals}
                onChange={(e) => setChemicals(e.target.value)}
                placeholder="Type chemicals or reaction here..."
                className="w-full h-32 p-4 bg-[#F5F5F5] border border-gray-300 rounded focus:border-[#141414] outline-none font-mono text-sm resize-none"
              />
            </div>
            <button 
              onClick={simulateReaction}
              disabled={isSimulating || !chemicals.trim()}
              className="w-full bg-[#141414] text-white py-4 rounded font-bold uppercase tracking-widest text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Beaker className="w-4 h-4" />
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-500 p-4 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Safety First</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Virtual simulations are safe, but always follow lab protocols in real life. Never mix chemicals without supervision.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!result && !isSimulating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center p-12 text-center"
            >
              <Beaker className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Ready for simulation</p>
              <p className="text-xs text-gray-400 mt-2">Enter chemicals on the left to see the magic happen.</p>
            </motion.div>
          )}

          {isSimulating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full bg-white border-2 border-[#141414] p-12 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_#141414]"
            >
              <div className="relative mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-4 border-gray-100 border-t-[#141414] rounded-full"
                />
                <Beaker className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing Molecular Bonds</h3>
              <p className="text-sm text-gray-500 font-mono">Predicting electron transfer and enthalpy changes...</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_#141414] overflow-hidden"
            >
              <div className={`p-6 border-b-2 border-[#141414] flex items-center justify-between ${result.reaction_occurred ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {result.reaction_occurred ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <Info className="w-8 h-8 text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{result.reaction_occurred ? 'Reaction Successful' : 'No Reaction'}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Simulation Result</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Danger Level</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`w-4 h-1.5 rounded-full ${lvl <= result.danger_level ? 'bg-red-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-[#141414] text-white p-6 rounded-lg font-mono text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  <p className="text-xs uppercase tracking-[0.2em] opacity-50 mb-4">Balanced Equation</p>
                  <p className="text-2xl font-bold tracking-tight">{result.equation}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <EffectCard label="Color Change" value={result.visual_effects.color_change || 'None'} />
                  <EffectCard label="Gas Evolution" value={result.visual_effects.gas_evolution ? 'Yes' : 'No'} />
                  <EffectCard label="Precipitate" value={result.visual_effects.precipitation || 'None'} />
                  <EffectCard label="Temperature" value={result.visual_effects.temperature} />
                </div>

                <div className="border-l-4 border-[#141414] pl-6 py-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Mechanism & Note</h4>
                  <p className="text-gray-700 leading-relaxed italic serif text-lg">
                    "{result.educational_note}"
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">?</div>
                    <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Quick Quiz</h4>
                  </div>
                  <p className="text-blue-800 font-medium">{result.quiz_question}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

function EffectCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-[#141414]">{value}</p>
    </div>
  );
}
