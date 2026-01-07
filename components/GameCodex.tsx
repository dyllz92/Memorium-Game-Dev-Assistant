
import React, { useState } from 'react';
import { GameCodex, GameElement } from '../types';
import { Brain, Heart, Sparkles, Hammer, Eye, Info, XCircle, MessageSquareWarning, Hexagon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import FeedbackPopover from './FeedbackPopover';

interface GameCodexProps {
  codex: GameCodex;
  onRemoveElement: (id: string) => void;
  reviewMode?: boolean;
  onAddFeedback?: (targetId: string, type: 'codex', title: string, content: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  premise: <Brain className="w-5 h-5 text-white" />,
  mechanic: <Hammer className="w-5 h-5 text-emerald-400" />,
  story: <Heart className="w-5 h-5 text-warm-rose" />,
  visual: <Eye className="w-5 h-5 text-warm-blue" />,
  character_arc: <Sparkles className="w-5 h-5 text-warm-purple" />
};

const GameCodexComponent: React.FC<GameCodexProps> = ({ codex, onRemoveElement, reviewMode, onAddFeedback }) => {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  if (codex.elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500 glass-panel rounded-[3rem] border border-white/5">
        <div className="p-6 rounded-full bg-white/5 mb-6">
             <Hexagon className="w-12 h-12 text-gray-600" />
        </div>
        <h3 className="text-xl font-heading font-bold text-gray-300 mb-2">The Library is Empty</h3>
        <p className="text-sm">Visit the Vision tab to synthesize your ideas.</p>
      </div>
    );
  }

  const grouped = codex.elements.reduce((acc, el) => {
    if (!acc[el.category]) acc[el.category] = [];
    acc[el.category].push(el);
    return acc;
  }, {} as Record<string, GameElement[]>);

  return (
    <div className="space-y-12 pb-24">
      {(Object.entries(grouped) as [string, GameElement[]][]).map(([category, elements]) => (
        <div key={category} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                {categoryIcons[category]}
            </div>
            <h3 className="text-2xl font-heading font-bold text-white capitalize">{category.replace('_', ' ')}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {elements.map(el => (
              <div key={el.id} className="glass-panel p-8 rounded-[2.5rem] relative group border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.02]">
                {activeFeedbackId === el.id && (
                  <FeedbackPopover 
                    targetTitle={el.title}
                    onClose={() => setActiveFeedbackId(null)}
                    onSubmit={(text) => onAddFeedback?.(el.id, 'codex', el.title, text)}
                  />
                )}
                
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {reviewMode && (
                    <button 
                      onClick={() => setActiveFeedbackId(el.id)}
                      className="p-2 bg-white/10 rounded-full text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"
                    >
                      <MessageSquareWarning className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => onRemoveElement(el.id)}
                    className="p-2 bg-white/10 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-bold text-xl text-white mb-4">
                  {el.title}
                </h4>
                <div className="text-base text-gray-300 leading-relaxed font-light opacity-90">
                  <ReactMarkdown>{el.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameCodexComponent;
