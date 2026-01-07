
import React, { useState } from 'react';
import { GameIteration } from '../types';
import { History, GitCommit, RefreshCcw, Send, Clock, Sparkles } from 'lucide-react';

interface IterationsManagerProps {
  iterations: GameIteration[];
  onApplyChange: (description: string) => void;
  onRevert: (id: string) => void;
  isProcessing: boolean;
}

const IterationsManager: React.FC<IterationsManagerProps> = ({ iterations, onApplyChange, onRevert, isProcessing }) => {
  const [changeDesc, setChangeDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDesc.trim() || isProcessing) return;
    onApplyChange(changeDesc);
    setChangeDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full pb-20">
      {/* Left: Input for Changes */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-8 rounded-[3rem] relative overflow-hidden border border-white/5">
           <div className="absolute top-0 right-0 w-64 h-64 bg-warm-purple/10 rounded-full blur-3xl pointer-events-none" />
           
          <h2 className="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-warm-purple" /> Evolve Idea
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-lg">
            Describe how you want to change your project. The system will reshape your Codex to match.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <textarea 
              value={changeDesc}
              onChange={(e) => setChangeDesc(e.target.value)}
              placeholder="e.g. Change the tone to be more hopeful, or make the main character older..."
              className="w-full h-48 bg-white/5 border border-white/10 p-6 rounded-[2rem] text-white text-base focus:border-warm-purple/50 outline-none transition-colors resize-none leading-relaxed"
            />
            <button 
              type="submit"
              disabled={!changeDesc.trim() || isProcessing}
              className="w-full bg-white text-calm-950 py-4 rounded-full font-bold text-lg hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg"
            >
              {isProcessing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Transform
            </button>
          </form>
        </div>
      </div>

      {/* Right: History Log */}
      <div className="space-y-4 flex flex-col h-full">
        <div className="px-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {iterations.slice().reverse().map((iter, idx) => (
            <div key={iter.id} className="glass-panel p-6 rounded-[2rem] hover:bg-white/10 transition-all group relative border border-white/5">
              <div className="flex items-center gap-2 text-warm-purple mb-2">
                <GitCommit className="w-4 h-4" />
                <span className="text-xs font-bold">Version {iterations.length - idx}.0</span>
              </div>
              <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                {iter.changeDescription}
              </p>
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">
                  {new Date(iter.timestamp).toLocaleTimeString()}
                </span>
                <button 
                  onClick={() => onRevert(iter.id)}
                  className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
          {iterations.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm text-gray-500">No changes yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IterationsManager;
