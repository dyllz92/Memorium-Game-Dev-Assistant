
import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface FeedbackPopoverProps {
  onClose: () => void;
  onSubmit: (text: string) => void;
  targetTitle: string;
}

const FeedbackPopover: React.FC<FeedbackPopoverProps> = ({ onClose, onSubmit, targetTitle }) => {
  const [text, setText] = useState('');

  return (
    <div className="absolute inset-0 z-50 bg-calm-950/60 backdrop-blur-md flex flex-col justify-center items-center animate-in fade-in duration-200 p-6 rounded-[2rem]">
      <div className="bg-calm-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-heading font-bold text-white">Reflect on: <span className="text-warm-blue">{targetTitle}</span></h4>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-5 h-5" /></button>
        </div>
        <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What comes to mind?"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-sm text-white focus:outline-none focus:border-warm-blue/50 resize-none mb-6 h-32 leading-relaxed"
        />
        <button
            disabled={!text.trim()}
            onClick={() => {
            onSubmit(text);
            onClose();
            }}
            className="w-full bg-white text-calm-950 hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-600 font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg"
        >
            <Send className="w-4 h-4" /> Save Note
        </button>
      </div>
    </div>
  );
};

export default FeedbackPopover;
