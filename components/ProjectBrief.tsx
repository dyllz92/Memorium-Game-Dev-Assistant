
import React, { useState } from 'react';
import { ProjectBrief } from '../types';
import { Save, MonitorPlay, Palette, Globe, Zap, Users } from 'lucide-react';

interface ProjectBriefProps {
  brief: ProjectBrief;
  onUpdateBrief: (brief: ProjectBrief) => void;
}

const ProjectBrief: React.FC<ProjectBriefProps> = ({ brief, onUpdateBrief }) => {
  const [formData, setFormData] = useState<ProjectBrief>(brief);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof ProjectBrief, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onUpdateBrief(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="glass-panel p-10 rounded-[3rem] relative shadow-soft border border-white/5">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-warm-blue via-warm-rose to-warm-purple" />
      
      <div className="flex justify-between items-center mb-10">
        <div>
           <h3 className="text-2xl font-heading font-bold text-white">Core Axioms</h3>
           <p className="text-gray-400 text-sm mt-1">The fundamental truths of your world.</p>
        </div>
        {isSaved && <span className="text-xs font-bold text-emerald-400 px-4 py-2 bg-emerald-400/10 rounded-full animate-pulse">Changes Saved</span>}
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-warm-rose/50 outline-none transition-colors"
                placeholder="Name your story..."
              />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Tone & Genre</label>
               <input 
                type="text" 
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-warm-rose/50 outline-none transition-colors"
                placeholder="e.g. Melancholic Mystery, Hopeful Sci-Fi..."
              />
            </div>
        </div>

        <div className="space-y-3">
           <label className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs ml-4">
            <Palette className="w-4 h-4 text-warm-purple" /> Aesthetic
          </label>
          <textarea 
            value={formData.artStyle}
            onChange={(e) => handleChange('artStyle', e.target.value)}
            className="w-full h-32 bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-warm-purple/50 outline-none transition-colors resize-none leading-relaxed"
            placeholder="Describe the visual language..."
          />
        </div>

        <div className="space-y-3">
           <label className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs ml-4">
            <Globe className="w-4 h-4 text-warm-blue" /> Setting
          </label>
          <textarea 
            value={formData.worldSetting}
            onChange={(e) => handleChange('worldSetting', e.target.value)}
            className="w-full h-32 bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-warm-blue/50 outline-none transition-colors resize-none leading-relaxed"
            placeholder="Where does this take place?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
            <label className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs ml-4">
                <Zap className="w-4 h-4 text-emerald-400" /> Mechanics
            </label>
            <textarea 
                value={formData.coreMechanicVisuals}
                onChange={(e) => handleChange('coreMechanicVisuals', e.target.value)}
                className="w-full h-40 bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-emerald-400/50 outline-none transition-colors resize-none leading-relaxed"
                placeholder="How does the player interact?"
            />
            </div>

            <div className="space-y-3">
            <label className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs ml-4">
                <Users className="w-4 h-4 text-warm-rose" /> Key Figures
            </label>
            <textarea 
                value={formData.keyCharacters}
                onChange={(e) => handleChange('keyCharacters', e.target.value)}
                className="w-full h-40 bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-base focus:border-warm-rose/50 outline-none transition-colors resize-none leading-relaxed"
                placeholder="Who are the main players?"
            />
            </div>
        </div>

        <div className="pt-6 flex justify-end">
           <button 
            onClick={handleSave}
            className="btn-soft flex items-center gap-3 bg-white text-calm-950 hover:bg-gray-100 px-8 py-4 text-base font-bold rounded-full shadow-lg transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBrief;
