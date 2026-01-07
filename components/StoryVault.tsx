
import React from 'react';
import { StoryNote } from '../types';
import { Book, Tag, Trash2, Hexagon, Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StoryVaultProps {
  notes: StoryNote[];
  onDeleteNote: (id: string) => void;
}

const StoryVault: React.FC<StoryVaultProps> = ({ notes, onDeleteNote }) => {
  return (
    <div className="h-full overflow-y-auto pr-2 pb-24">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {notes.map(note => (
          <div key={note.id} className="break-inside-avoid glass-panel rounded-[2.5rem] p-8 hover:bg-white/[0.02] transition-colors group border border-white/5 shadow-sm hover:shadow-soft">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warm-rose/10 rounded-full text-warm-rose">
                    <Quote className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-white leading-tight">{note.title}</h3>
              </div>
              <button 
                onClick={() => onDeleteNote(note.id)}
                className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-8 font-light leading-relaxed">
               <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-2">
              {note.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 rounded-full text-gray-400 border border-white/5">
                  <Tag className="w-3 h-3 text-warm-blue" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        
        {notes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-500 glass-panel rounded-[3rem]">
            <Hexagon className="w-16 h-16 mb-4 text-gray-700 opacity-50" />
            <p className="font-heading text-xl font-bold text-gray-400">The Vault is Silent</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryVault;
