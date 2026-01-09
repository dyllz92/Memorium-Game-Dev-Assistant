
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, BookOpen, Layers, Users, ScrollText, Archive, GitBranch, RefreshCcw, Home, ClipboardCheck, Eye, Menu, X, Sparkles, Heart } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TaskBoard from './components/TaskBoard';
import StoryVault from './components/StoryVault';
import CharacterList from './components/CharacterList';
import ProjectBriefComponent from './components/ProjectBriefEditor';
import GameCodexComponent from './components/GameCodex';
import IterationsManager from './components/IterationsManager';
import Dashboard from './components/Dashboard';
import ReviewLog from './components/ReviewLog';
import LoginScreen from './components/LoginScreen';
import { Task, StoryNote, ChatMessage, TaskStatus, Character, ProjectBrief, GameCodex, GameIteration, GameElement, FeedbackNote, UserProfile } from './types';
import { sendMessageToGemini, generateImage, compileGameBones, applyIterationChanges } from './services/geminiService';

enum Tab {
  DASHBOARD = 'dashboard',
  BRIEF = 'brief',
  CODEX = 'codex',
  ITERATIONS = 'iterations',
  CHAT = 'chat',
  TASKS = 'tasks',
  STORY = 'story',
  CHARACTERS = 'characters',
  REVIEWS = 'reviews'
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD); 
  const [reviewMode, setReviewMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [storyNotes, setStoryNotes] = useState<StoryNote[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief>({
    title: '', genre: '', artStyle: '', worldSetting: '', coreMechanicVisuals: '', keyCharacters: ''
  });
  const [codex, setCodex] = useState<GameCodex>({ elements: [], lastUpdated: 0 });
  const [iterations, setIterations] = useState<GameIteration[]>([]);
  const [feedback, setFeedback] = useState<FeedbackNote[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'system', content: 'Memorium is here to support your creative journey. How are you feeling about your project today?', timestamp: Date.now() }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingCharId, setGeneratingCharId] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const userProfileStorageKey = 'memorium-user-profile';

  useEffect(() => {
    const storedProfile = localStorage.getItem(userProfileStorageKey);
    if (!storedProfile) return;
    try {
      const parsedProfile = JSON.parse(storedProfile) as UserProfile;
      if (parsedProfile?.name) {
        setUser(parsedProfile);
      }
    } catch (error) {
      console.warn('Failed to read stored profile.', error);
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  const handleLogin = (profile: UserProfile, options?: { persist?: boolean }) => {
    setUser(profile);
    if (options?.persist) {
      localStorage.setItem(userProfileStorageKey, JSON.stringify(profile));
    }
  };

  const addFeedback = (targetId: string, targetType: FeedbackNote['targetType'], targetTitle: string, content: string) => {
    const newNote: FeedbackNote = {
      id: Math.random().toString(36).substr(2, 9),
      targetId, targetType, targetTitle, content,
      timestamp: Date.now()
    };
    setFeedback(prev => [newNote, ...prev]);
  };

  const handleCompileBones = async () => {
    if (!projectBrief.title) return alert("Please give your project a name to begin.");
    setIsProcessing(true);
    setCompileError(null);
    try {
      const compiled = await compileGameBones(projectBrief);
      setCodex(compiled);
      setIterations([{
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        changeDescription: "Initial creative synthesis.",
        codex: compiled
      }]);
      setActiveTab(Tab.CODEX);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "We couldn't synthesize your vision right now. Please try again.";
      setCompileError(message);
    } finally { setIsProcessing(false); }
  };

  function formatBriefToCodex(b: ProjectBrief): GameCodex {
    const elements: GameElement[] = [] as any;
    if (b.title) elements.push({ type: 'title', title: 'Title', content: b.title });
    if (b.genre) elements.push({ type: 'genre', title: 'Tone & Genre', content: b.genre });
    if (b.artStyle) elements.push({ type: 'art', title: 'Aesthetic', content: b.artStyle });
    if (b.worldSetting) elements.push({ type: 'world', title: 'Setting', content: b.worldSetting });
    if (b.coreMechanicVisuals) elements.push({ type: 'mechanics', title: 'Core Mechanics', content: b.coreMechanicVisuals });
    if (b.keyCharacters) elements.push({ type: 'characters', title: 'Key Figures', content: b.keyCharacters });
    return { elements, lastUpdated: Date.now() } as any;
  }

  const handleSendBriefToLibrary = async (b: ProjectBrief) => {
    setIsProcessing(true);
    setCompileError(null);
    try {
      const compiled = await compileGameBones(b);
      setCodex(compiled);
      setActiveTab(Tab.CODEX);
      showToast('Sent to Library');
    } catch (e) {
      const fallback = formatBriefToCodex(b);
      setCodex(fallback);
      setActiveTab(Tab.CODEX);
      const message = e instanceof Error ? e.message : 'AI generation failed; used local formatting.';
      setCompileError(message);
      showToast('AI generation failed; used local formatting.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyIteration = async (changeRequest: string) => {
    setIsProcessing(true);
    try {
      const updatedCodex = await applyIterationChanges(codex, changeRequest);
      setCodex(updatedCodex);
      setIterations(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        changeDescription: changeRequest,
        codex: updatedCodex
      }]);
      setActiveTab(Tab.CODEX);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveCodexElement = (id: string) => {
    setCodex(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      lastUpdated: Date.now()
    }));
  };

  const handleRevert = (id: string) => {
    const iteration = iterations.find(iter => iter.id === id);
    if (iteration) {
      setCodex(iteration.codex);
      setActiveTab(Tab.CODEX);
    }
  };

  const addTask = (title: string, status: TaskStatus, description: string = '') => {
    const newTask: Task = { id: Math.random().toString(36).substr(2, 9), title, status, description, createdAt: Date.now() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const addStoryNote = (title: string, content: string, tags: string[] = []) => {
    const newNote: StoryNote = { id: Math.random().toString(36).substr(2, 9), title, content, tags, createdAt: Date.now() };
    setStoryNotes(prev => [...prev, newNote]);
    return newNote;
  };

  const addCharacter = (name: string, role: string, description: string, backstory: string, occupation: string, maritalStatus: string, personalityTraits: string[], abilities: string[] = [], motivations: string = '', fears: string = '', relationships: string = '', imageUrl: string = '') => {
    const newChar: Character = { id: Math.random().toString(36).substr(2, 9), name, role, description, backstory, occupation, maritalStatus, personalityTraits, abilities, motivations, fears, relationships, imageUrl, createdAt: Date.now() };
    setCharacters(prev => [...prev, newChar]);
    return newChar;
  };

  const handleGenerateCharacterArt = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    setGeneratingCharId(charId);
    try {
        let prompt = `Soft, dreamlike, emotional digital art, warm sunset lighting, gentle brushstrokes: ${char.name}, ${char.role}. Visual: ${char.description}. Focus on hope and memory.`;
        const imageUrl = await generateImage(prompt, "3:4");
        if (imageUrl) setCharacters(prev => prev.map(c => c.id === charId ? { ...c, imageUrl } : c));
    } catch (e) { console.error(e); } finally { setGeneratingCharId(null); }
  };

  const smartSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const response = await sendMessageToGemini(history, text, { tasks, notes: storyNotes, characters, brief: projectBrief, codex },
        async (toolName, args) => {
          if (toolName === 'generate_image') {
            const img = await generateImage(`${args.prompt}. Soft, warm, emotional art style.`, args.aspectRatio);
            return { status: 'image_generated', uri: img };
          }
          if (toolName === 'add_task') {
              const status = args.status === 'DONE' ? TaskStatus.DONE : args.status === 'IN_PROGRESS' ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
              addTask(args.title, status, args.description);
              return { status: 'task_added', title: args.title };
          }
          if (toolName === 'add_story_note') {
              addStoryNote(args.title, args.content, args.tags);
              return { status: 'note_added', title: args.title };
          }
          if (toolName === 'add_character') {
              addCharacter(args.name, args.role, args.description, args.backstory, args.occupation, args.maritalStatus, args.personalityTraits, args.abilities, args.motivations, args.fears, args.relationships);
              return { status: 'character_added', name: args.name };
          }
          return { error: 'Unknown tool' };
        }
      );
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response.text, timestamp: Date.now() }]);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`relative w-full flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 font-medium text-sm ${
        activeTab === tab 
          ? 'bg-gradient-to-r from-warm-blue/15 via-warm-rose/15 to-warm-purple/15 text-white shadow-soft' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === tab ? 'text-warm-rose' : 'text-gray-500'}`} />
      <span>{label}</span>
      {activeTab === tab && (
        <div className="absolute right-4 w-2 h-2 rounded-full bg-warm-rose shadow-glow" />
      )}
    </button>
  );

  // --- Auth Gate ---
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-calm-950 text-gray-200 overflow-hidden relative selection:bg-warm-rose/30">
      {/* Ambient Background Glows - Increased visibility for lighter tone */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-warm-purple/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-warm-blue/15 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] left-[50%] transform -translate-x-1/2 w-[40%] h-[40%] rounded-full bg-warm-rose/5 blur-[100px] pointer-events-none" />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-calm-950/80 backdrop-blur-md z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 glass-panel border-r-0 transition-transform duration-500 lg:relative lg:translate-x-0 m-0 lg:m-4 lg:rounded-[2.5rem] lg:my-4
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-24 flex items-center px-8">
          <button onClick={() => { setActiveTab(Tab.DASHBOARD); setSidebarOpen(false); }} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-warm-blue to-warm-rose flex items-center justify-center shadow-glow">
              <Heart className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div className="text-left">
               <h1 className="font-heading font-bold text-xl text-white tracking-tight">Memorium</h1>
               <p className="text-xs text-warm-slate">Your Creative Space</p>
            </div>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavButton tab={Tab.DASHBOARD} icon={Home} label="Sanctuary" />
          
          <div className="mt-8 mb-4 px-6 text-xs font-semibold text-warm-slate uppercase tracking-wider">Foundation</div>
          <NavButton tab={Tab.BRIEF} icon={ScrollText} label="Vision" />
          <NavButton tab={Tab.CODEX} icon={Archive} label="The Library" />
          <NavButton tab={Tab.ITERATIONS} icon={GitBranch} label="Evolution" />
          
          <div className="mt-8 mb-4 px-6 text-xs font-semibold text-warm-slate uppercase tracking-wider">Creation</div>
          <NavButton tab={Tab.CHAT} icon={MessageSquare} label="Companion" />
          <NavButton tab={Tab.CHARACTERS} icon={Users} label="Characters" />
          <NavButton tab={Tab.TASKS} icon={LayoutDashboard} label="Journey" />
          <NavButton tab={Tab.STORY} icon={BookOpen} label="Memories" />
          
          <div className="mt-8 mb-4 px-6 text-xs font-semibold text-warm-slate uppercase tracking-wider">Insight</div>
          <NavButton tab={Tab.REVIEWS} icon={ClipboardCheck} label="Reflection" />
        </nav>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="lg:hidden h-20 flex items-center px-6 glass-panel sticky top-0 z-30 justify-between backdrop-blur-xl">
           <button onClick={() => { setActiveTab(Tab.DASHBOARD); setSidebarOpen(false); }} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
             <Heart className="w-6 h-6 text-warm-rose" />
             <span className="font-heading font-bold text-lg text-white">Memorium</span>
           </button>
           <button onClick={() => setSidebarOpen(true)} className="p-3 text-gray-400 bg-white/5 rounded-full"><Menu className="w-6 h-6" /></button>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className="h-full p-4 md:p-8 lg:p-10 relative z-10 overflow-y-auto overflow-x-hidden scroll-smooth">
            {activeTab === Tab.DASHBOARD && <Dashboard brief={projectBrief} codex={codex} iterations={iterations} characters={characters} tasks={tasks} notes={storyNotes} onNavigate={(t) => setActiveTab(t as Tab)} userName={user.name} />}
            
            {activeTab === Tab.BRIEF && (
              <div className="max-w-4xl mx-auto space-y-10 pb-24">
                 <div className="text-center space-y-4 mb-10">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold gradient-text">Project Vision</h2>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">Define the soul of your project. Let's build something meaningful together.</p>
                 </div>
                <ProjectBriefComponent brief={projectBrief} onUpdateBrief={setProjectBrief} onSendToLibrary={handleSendBriefToLibrary} />
                {compileError && (
                  <div className="rounded-3xl border border-warm-rose/30 bg-warm-rose/10 px-6 py-4 text-sm text-warm-rose">
                    {compileError}
                  </div>
                )}
                <div className="flex justify-center">
                  <button onClick={handleCompileBones} disabled={isProcessing} className="btn-soft bg-gradient-to-r from-warm-blue to-warm-rose text-white px-10 py-5 rounded-full text-lg font-bold shadow-glow hover:shadow-lg flex items-center gap-3 disabled:opacity-50">
                    {isProcessing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {codex.elements.length > 0 ? "Reimagine Essence" : "Synthesize Vision"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === Tab.CODEX && (
              <div className="max-w-5xl mx-auto">
                 <div className="mb-10">
                    <h2 className="text-4xl font-heading font-bold text-white mb-2">The Library</h2>
                    <p className="text-gray-400">Your core pillars and truths.</p>
                 </div>
                <GameCodexComponent codex={codex} onRemoveElement={handleRemoveCodexElement} reviewMode={reviewMode} onAddFeedback={addFeedback} />
              </div>
            )}

            {activeTab === Tab.ITERATIONS && (
              <div className="max-w-6xl mx-auto h-full flex flex-col">
                 <div className="mb-10">
                    <h2 className="text-4xl font-heading font-bold text-white mb-2">Evolution</h2>
                    <p className="text-gray-400">Track the growth of your ideas.</p>
                 </div>
                <IterationsManager iterations={iterations} onApplyChange={handleApplyIteration} onRevert={handleRevert} isProcessing={isProcessing} />
              </div>
            )}

            {activeTab === Tab.CHAT && <ChatInterface messages={messages} onSendMessage={smartSendMessage} isProcessing={isProcessing} />}
            {activeTab === Tab.TASKS && <TaskBoard tasks={tasks} onMoveTask={(id, s) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t))} onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onAddTask={(s) => addTask("New Step", s)} reviewMode={reviewMode} onAddFeedback={addFeedback} />}
            {activeTab === Tab.STORY && <StoryVault notes={storyNotes} onDeleteNote={(id) => setStoryNotes(prev => prev.filter(n => n.id !== id))} />}
            {activeTab === Tab.CHARACTERS && <CharacterList characters={characters} onDeleteCharacter={(id) => setCharacters(prev => prev.filter(c => c.id !== id))} onAddCharacter={(c) => addCharacter(c.name, c.role, c.description, c.backstory, c.occupation, c.maritalStatus, c.personalityTraits, c.abilities, c.motivations, c.fears, c.relationships, c.imageUrl)} onGenerateArt={handleGenerateCharacterArt} onGeneratePreview={(d) => generateImage(`Soft warm emotional portrait style: ${d.name}, ${d.role}. ${d.description}.`, "3:4")} generatingCharId={generatingCharId} reviewMode={reviewMode} onAddFeedback={addFeedback} />}
            {activeTab === Tab.REVIEWS && <ReviewLog feedback={feedback} onDelete={(id) => setFeedback(prev => prev.filter(f => f.id !== id))} />}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-3xl shadow-soft border text-sm 
          ${toast.type === 'success' ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300' : 'bg-warm-rose/10 border-warm-rose/30 text-warm-rose'}`}
        >
          {toast.text}
        </div>
      )}

      {/* Mode Toggle - Floating Pill */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setReviewMode(!reviewMode)} 
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-soft transition-all btn-soft ${
            reviewMode 
              ? 'bg-warm-blue text-white shadow-glow' 
              : 'glass-panel text-gray-300 hover:text-white border-calm-border'
          }`}
        >
          <Eye className={`w-5 h-5 ${reviewMode ? 'animate-pulse' : ''}`} />
          {reviewMode ? 'Feedback Mode' : 'View Mode'}
        </button>
      </div>
    </div>
  );
};

export default App;
