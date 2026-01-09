
import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Mail, Lock, User, Chrome } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for a smoother feel
    setTimeout(() => {
      // For registration, use the input name. For login, default to "Traveler" or use username if provided
      // In a real app, we would fetch the user's name from the backend upon login.
      const displayName = isRegistering ? formData.name : (formData.username || "Traveler");
      onLogin(displayName);
      setLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin("Google User");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-calm-950 p-4">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-warm-purple/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-warm-blue/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-warm-blue to-warm-rose shadow-glow mb-4">
            <Heart className="w-8 h-8 text-white fill-white/20" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white tracking-tight">Memorium</h1>
          <p className="text-warm-slate">Your Creative Companion</p>
        </div>

        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Toggle Switch */}
            <div className="flex bg-calm-900/50 p-1 rounded-full mb-8 relative">
                <div 
                    className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white/10 rounded-full shadow-sm transition-all duration-300 ${isRegistering ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                />
                <button 
                    onClick={() => setIsRegistering(false)} 
                    className={`flex-1 py-3 text-sm font-bold rounded-full relative z-10 transition-colors ${!isRegistering ? 'text-white' : 'text-gray-500'}`}
                >
                    Sign In
                </button>
                <button 
                    onClick={() => setIsRegistering(true)} 
                    className={`flex-1 py-3 text-sm font-bold rounded-full relative z-10 transition-colors ${isRegistering ? 'text-white' : 'text-gray-500'}`}
                >
                    Register
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {isRegistering && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="text" 
                                required={isRegistering}
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-4 text-white focus:border-warm-blue/50 outline-none transition-all placeholder-gray-600" 
                                placeholder="Your Name" 
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Username</label>
                    <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            required 
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-4 text-white focus:border-warm-blue/50 outline-none transition-all placeholder-gray-600" 
                            placeholder="username" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-4">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="password" 
                            required 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-4 text-white focus:border-warm-blue/50 outline-none transition-all placeholder-gray-600" 
                            placeholder="••••••••" 
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-white text-calm-950 py-4 rounded-full font-bold text-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 mt-6"
                >
                   {loading ? (
                       <Sparkles className="w-5 h-5 animate-spin text-warm-purple" />
                   ) : (
                       <>
                        {isRegistering ? 'Start Journey' : 'Resume Journey'} <ArrowRight className="w-5 h-5" />
                       </>
                   )}
                </button>
            </form>

            <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                <div className="h-px bg-white/5 flex-1" />
            </div>

            <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-full font-bold text-sm flex items-center justify-center gap-3 transition-all group"
            >
                <Chrome className="w-5 h-5 text-white group-hover:text-warm-blue transition-colors" />
                Google
            </button>
        </div>
        
        <p className="text-center text-gray-500 text-xs mt-8">
            By entering, you agree to our <span className="text-gray-400 hover:text-white cursor-pointer underline">Terms of Creativity</span>.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
