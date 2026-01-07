
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Loader2, Sparkles, User, Bot, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-[2.5rem] overflow-hidden shadow-soft border border-white/5 relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-warm-blue to-warm-rose rounded-full flex items-center justify-center shadow-glow">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-white">Companion</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-400">Here for you</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
             <Sparkles className="w-16 h-16 mb-6 text-warm-purple" />
             <p className="font-heading text-3xl font-bold text-gray-400 mb-2">How can I help?</p>
             <p className="text-sm">Share your thoughts, ideas, or feelings.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
              <div className={`flex items-center gap-2 mb-1 px-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs font-semibold text-gray-500">
                  {msg.role === 'user' ? 'You' : 'Memorium'}
                </span>
              </div>
              
              <div className={`p-6 text-sm md:text-base leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-warm-rose to-warm-purple text-white rounded-[2rem] rounded-tr-none' 
                  : 'bg-white/10 text-gray-100 rounded-[2rem] rounded-tl-none border border-white/5 backdrop-blur-sm'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-warm-blue">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.imageUri && (
                  <div className="mt-4 rounded-3xl overflow-hidden shadow-lg border border-white/10">
                    <img src={msg.imageUri} alt="Generated Visual" className="w-full h-auto" />
                  </div>
                )}
              </div>
              
              <span className={`text-[10px] text-gray-600 px-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="px-6 py-4 rounded-[2rem] rounded-tl-none bg-white/5 border border-white/5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-warm-purple" />
              <span className="text-xs font-medium text-gray-400">Thinking gently...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex gap-2 items-end bg-calm-900/50 p-2 rounded-[2.5rem] border border-white/10 focus-within:border-warm-purple/50 transition-colors shadow-inner">
          <button className="p-4 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all">
             <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-4 text-white placeholder-gray-500 focus:outline-none resize-none h-[60px] max-h-[120px] scrollbar-hide text-base"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              !input.trim() || isProcessing 
                ? 'bg-white/5 text-gray-600' 
                : 'bg-warm-rose text-white shadow-glow hover:scale-105 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
