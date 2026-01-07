
import React from 'react';
import { FeedbackNote } from '../types';
import { ClipboardCheck, Trash2, Clock, Box, User, CheckSquare, MessageCircle } from 'lucide-react';

interface ReviewLogProps {
  feedback: FeedbackNote[];
  onDelete: (id: string) => void;
}

const targetIcons: Record<string, React.ReactNode> = {
  codex: <Box className="w-4 h-4" />,
  character: <User className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  general: <MessageCircle className="w-4 h-4" />
};

const ReviewLog: React.FC<ReviewLogProps> = ({ feedback, onDelete }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-heading font-bold text-white mb-2">Reflections</h2>
        <p className="text-gray-400">Notes and thoughts collected along the way.</p>
      </div>

      <div className="space-y-4">
        {feedback.map(note => (
          <div key={note.id} className="glass-panel p-6 rounded-[2rem] hover:bg-white/[0.02] transition-colors relative group border border-white/5 flex gap-6 items-start">
            <div className="p-3 bg-white/5 rounded-2xl text-warm-blue shrink-0">
                {targetIcons[note.targetType] || <ClipboardCheck className="w-5 h-5" />}
            </div>
            
            <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-warm-blue opacity-80">
                        {note.targetType}
                    </span>
                    <button 
                        onClick={() => onDelete(note.id)}
                        className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <h3 className="text-white font-bold text-lg mb-2">{note.targetTitle}</h3>
                
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                {note.content}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(note.timestamp).toLocaleString()}
                </div>
            </div>
          </div>
        ))}

        {feedback.length === 0 && (
          <div className="py-24 text-center glass-panel rounded-[3rem]">
            <ClipboardCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Quiet Reflection</h3>
            <p className="text-sm text-gray-500 mt-2">No notes have been recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewLog;
