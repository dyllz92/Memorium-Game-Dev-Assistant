
import React from 'react';
import { ProjectBrief, GameCodex, GameIteration, Character, Task, StoryNote, TaskStatus } from '../types';
import { Plus, Archive, Users, LayoutDashboard, ScrollText, GitBranch, BookOpen, ChevronRight, Activity, Brain, TrendingUp, Sparkles, Heart } from 'lucide-react';

interface DashboardProps {
  brief: ProjectBrief;
  codex: GameCodex;
  iterations: GameIteration[];
  characters: Character[];
  tasks: Task[];
  notes: StoryNote[];
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ brief, codex, iterations, characters, tasks, notes, onNavigate }) => {
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="glass-panel p-6 rounded-[2rem] hover:bg-white/5 transition-all duration-500 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity ${colorClass}`} />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-5xl font-heading font-bold text-white relative z-10">{value}</div>
    </div>
  );

  const ActionCard = ({ title, description, icon: Icon, onClick, gradient }: any) => (
    <button 
      onClick={onClick}
      className="group flex flex-col items-start gap-4 glass-panel p-8 rounded-[2.5rem] text-left hover:-translate-y-1 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-glow"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      <div className="flex justify-between w-full items-start">
        <div className={`p-4 rounded-3xl bg-white/5 group-hover:bg-white/10 text-white transition-all duration-300`}>
            <Icon className="w-7 h-7" />
        </div>
        <div className="p-2 rounded-full bg-white/0 group-hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
        </div>
      </div>
      
      <div className="mt-2">
        <h4 className="font-heading font-bold text-xl text-white mb-2 group-hover:text-warm-rose transition-colors">
          {title}
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Welcome Hero */}
      <div className="relative glass-panel rounded-[3rem] p-10 md:p-14 overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-warm-purple/20 to-transparent rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-warm-blue/10 to-transparent rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-full text-warm-rose text-xs font-bold uppercase tracking-wider mb-6 border border-white/5">
            <Heart className="w-3.5 h-3.5" /> Creative Flow Active
          </div>
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {brief.title || "Hello, James."}
          </h2>
          <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed mb-10 max-w-2xl">
            {brief.genre ? `Exploring the ${brief.genre} themes of your story. ` : "Let's begin by defining the soul of your project. "}
            Breathe life into your ideas.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => onNavigate('chat')} className="btn-soft px-8 py-4 rounded-full bg-white text-calm-950 font-bold text-lg hover:bg-gray-100 flex items-center gap-2 shadow-lg">
              <Sparkles className="w-5 h-5 text-warm-purple" /> Start Creating
            </button>
            <button onClick={() => onNavigate('brief')} className="btn-soft px-8 py-4 rounded-full bg-white/5 text-white font-bold text-lg hover:bg-white/10 border border-white/10">
              Refine Vision
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Core Pillars" value={codex.elements.length} icon={Archive} colorClass="bg-warm-purple" />
        <StatCard label="Characters" value={characters.length} icon={Users} colorClass="bg-warm-rose" />
        <StatCard label="Steps" value={tasks.filter(t => t.status !== TaskStatus.DONE).length} icon={LayoutDashboard} colorClass="bg-warm-blue" />
        <StatCard label="Cycles" value={iterations.length} icon={GitBranch} colorClass="bg-white" />
      </div>

      {/* Main Actions Grid */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <h3 className="text-2xl font-heading font-bold text-white">Your Studio</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard title="New Character" description="Breathe life into a new character." icon={Plus} gradient="from-warm-purple/20 to-warm-rose/20" onClick={() => onNavigate('characters')} />
          <ActionCard title="Deepen Story" description="Write a memory or story fragment." icon={BookOpen} gradient="from-warm-rose/20 to-warm-blue/20" onClick={() => onNavigate('story')} />
          <ActionCard title="Evolve Idea" description="Refine your core concepts." icon={TrendingUp} gradient="from-warm-blue/20 to-warm-purple/20" onClick={() => onNavigate('iterations')} />
          <ActionCard title="Library" description="Review your established truths." icon={Brain} gradient="from-gray-700/20 to-gray-500/20" onClick={() => onNavigate('codex')} />
          <ActionCard title="Journey Map" description="Organize your next steps." icon={LayoutDashboard} gradient="from-blue-500/20 to-purple-500/20" onClick={() => onNavigate('tasks')} />
          <ActionCard title="Vision Board" description="Update the project essence." icon={ScrollText} gradient="from-emerald-500/20 to-teal-500/20" onClick={() => onNavigate('brief')} />
        </div>
      </div>

      {/* Progress Section */}
      <div className="glass-panel p-8 md:p-12 rounded-[3rem] flex flex-col md:flex-row gap-10 items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-warm-purple/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-10 relative z-10">
          <div className="relative w-32 h-32 shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="58" stroke="url(#warm-grad)" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs>
                  <linearGradient id="warm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
             </svg>
             <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-3xl text-white">
                {progressPercent}%
             </div>
          </div>
          <div>
            <h4 className="text-3xl font-heading font-bold text-white mb-2">Journey Progress</h4>
            <p className="text-gray-400 font-medium">Completed steps: {completedTasks} / {tasks.length}</p>
          </div>
        </div>
        <button onClick={() => onNavigate('tasks')} className="relative z-10 btn-soft px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg transition-all flex items-center gap-3">
          View Journey <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
