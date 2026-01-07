
import React, { useState, useRef } from 'react';
import { Character } from '../types';
import { User, Trash2, Palette, Plus, X, Loader2, Image as ImageIcon, Sparkles, MessageSquareWarning, Heart } from 'lucide-react';
import FeedbackPopover from './FeedbackPopover';

interface CharacterListProps {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
  onAddCharacter: (char: Omit<Character, 'id' | 'createdAt'>) => void;
  onGenerateArt: (id: string) => void;
  onGeneratePreview: (details: any) => Promise<string | null>;
  generatingCharId?: string | null;
  reviewMode?: boolean;
  onAddFeedback?: (targetId: string, type: 'character', title: string, content: string) => void;
}

const CharacterList: React.FC<CharacterListProps> = ({ 
    characters, onDeleteCharacter, onAddCharacter, onGenerateArt, onGeneratePreview, generatingCharId, reviewMode, onAddFeedback
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newChar, setNewChar] = useState({
    name: '', role: '', description: '', backstory: '', occupation: '', maritalStatus: '', personalityTraits: '', abilities: '', motivations: '', fears: '', relationships: '', imageUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCharacter({
        ...newChar,
        personalityTraits: newChar.personalityTraits.split(',').map(s => s.trim()).filter(s => s.length > 0),
        abilities: newChar.abilities.split(',').map(s => s.trim()).filter(s => s.length > 0),
    });
    setNewChar({ name: '', role: '', description: '', backstory: '', occupation: '', maritalStatus: '', personalityTraits: '', abilities: '', motivations: '', fears: '', relationships: '', imageUrl: '' });
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewChar(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateFromBio = async () => {
    if (!newChar.description && !newChar.name) return alert("Please provide some details first.");
    setIsPreviewLoading(true);
    try {
      const url = await onGeneratePreview(newChar);
      if (url) setNewChar(prev => ({ ...prev, imageUrl: url }));
    } catch (err) { console.error(err); } finally { setIsPreviewLoading(false); }
  };

  return (
    <div className="h-full flex flex-col space-y-10 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-heading font-bold text-white">Characters & Archetypes</h2>
            <p className="text-gray-400 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warm-purple" /> Active Characters: {characters.length}
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-soft bg-white text-calm-950 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-3 hover:bg-gray-100">
            <Plus className="w-5 h-5" /> New Character
          </button>
       </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-calm-950/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-5xl rounded-[3rem] p-8 md:p-12 relative shadow-2xl border border-white/10">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
                <div className="mb-10">
                  <h3 className="text-3xl font-heading font-bold text-white mb-2">Define Character</h3>
                  <p className="text-gray-400">Define the essence of this character.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Name</label>
                            <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:border-warm-purple/50 outline-none transition-all" placeholder="Identity" value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Role</label>
                            <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:border-warm-purple/50 outline-none transition-all" placeholder="Archetype" value={newChar.role} onChange={e => setNewChar({...newChar, role: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:border-white/20 outline-none" placeholder="Occupation" value={newChar.occupation} onChange={e => setNewChar({...newChar, occupation: e.target.value})} />
                          <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:border-white/20 outline-none" placeholder="Status" value={newChar.maritalStatus} onChange={e => setNewChar({...newChar, maritalStatus: e.target.value})} />
                      </div>
                      <textarea required className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white h-24 resize-none focus:border-white/20 outline-none" placeholder="What drives them?" value={newChar.motivations} onChange={e => setNewChar({...newChar, motivations: e.target.value})} />
                      <textarea required className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white h-24 resize-none focus:border-white/20 outline-none" placeholder="What haunts them?" value={newChar.fears} onChange={e => setNewChar({...newChar, fears: e.target.value})} />
                    </div>

                    <div className="w-full lg:w-80 flex flex-col gap-6">
                      <div className="relative aspect-[3/4] glass-panel rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center group border border-white/10 bg-black/20">
                        {newChar.imageUrl ? (
                          <>
                            <img src={newChar.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                               <button type="button" onClick={() => setNewChar(p => ({...p, imageUrl: ''}))} className="bg-white/10 hover:bg-red-500/20 p-4 rounded-full text-white transition-all"><Trash2 className="w-6 h-6"/></button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-3">
                            {isPreviewLoading ? <Loader2 className="w-10 h-10 text-warm-purple animate-spin mx-auto" /> : <ImageIcon className="w-10 h-10 text-gray-600 mx-auto" />}
                            <p className="text-xs text-gray-500 font-medium">No Visual Yet</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="glass-panel hover:bg-white/10 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all">Upload</button>
                        <button type="button" onClick={handleGenerateFromBio} disabled={isPreviewLoading} className="bg-warm-purple hover:bg-warm-purple/80 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all">Dream It</button>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                      <button type="submit" className="w-full bg-white text-calm-950 py-5 rounded-[2rem] font-bold text-lg hover:scale-105 transition-transform shadow-xl mt-auto">
                        Bring to Life
                      </button>
                    </div>
                </form>
            </div>
        </div>
       )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {characters.map(char => (
          <div key={char.id} className="flex flex-col sm:flex-row glass-panel rounded-[3rem] overflow-hidden group hover:bg-white/[0.02] transition-colors border border-white/5 shadow-soft">
              {activeFeedbackId === char.id && (
                <FeedbackPopover targetTitle={char.name} onClose={() => setActiveFeedbackId(null)} onSubmit={(text) => onAddFeedback?.(char.id, 'character', char.name, text)} />
              )}

              <div className="w-full sm:w-48 h-64 sm:h-auto bg-calm-900 relative flex-shrink-0 overflow-hidden">
                {char.imageUrl ? (
                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-calm-800 to-calm-900">
                      <User className="w-12 h-12 text-gray-700" />
                    </div>
                )}
                
                {/* Actions Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                   <div className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white/80">
                      <Heart className="w-4 h-4" />
                   </div>
                   <div className="flex gap-2">
                    {reviewMode && <button onClick={() => setActiveFeedbackId(char.id)} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"><MessageSquareWarning className="w-4 h-4" /></button>}
                    <button onClick={() => onGenerateArt(char.id)} disabled={generatingCharId === char.id} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-colors">{generatingCharId === char.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Palette className="w-4 h-4" />}</button>
                    <button onClick={() => onDeleteCharacter(char.id)} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col gap-5">
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-heading font-bold text-2xl text-white mb-1">{char.name}</h3>
                     <span className="inline-block px-3 py-1 rounded-full bg-warm-purple/10 text-warm-purple text-xs font-bold uppercase tracking-wider">{char.role}</span>
                   </div>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Motivation</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{char.motivations}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Fear</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{char.fears}</p>
                    </div>
                 </div>

                 <div className="mt-auto pt-4 flex flex-wrap gap-2">
                   {char.personalityTraits.slice(0, 3).map((t, i) => (
                     <span key={i} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-400">{t}</span>
                   ))}
                 </div>
              </div>
          </div>
          ))}
      </div>
    </div>
  );
};

export default CharacterList;
