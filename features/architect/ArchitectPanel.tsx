import React, { useState, useRef, useEffect } from 'react';
import { generateStructure } from './architectService';
import { ChatMessage, VoxelData, BlockType } from '../../shared/types';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ArchitectPanelProps {
  onApplyStructure: (voxels: VoxelData[]) => void;
}

export const ArchitectPanel: React.FC<ArchitectPanelProps> = ({ onApplyStructure }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy tu Arquitecto Gemini. Dime qué quieres construir y generaré los voxels por ti. (Ej: "Una casa roja", "Un árbol pixelado")',
      isSystem: true
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateStructure(userMsg.text, messages.map(m => m.text).join('\n'));
      
      const aiMsg: ChatMessage = {
        id: uuidv4(),
        sender: 'ai',
        text: response.message
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.voxels && response.voxels.length > 0) {
        // Convert API voxels to App VoxelData format
        const newVoxels: VoxelData[] = response.voxels.map(v => ({
          id: uuidv4(),
          position: [v.x, v.y, v.z],
          color: v.color,
          type: v.type || BlockType.SOLID
        }));
        onApplyStructure(newVoxels);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        sender: 'ai',
        text: 'Hubo un error de conexión con mi cerebro digital. Intenta de nuevo.',
        isSystem: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-80 lg:w-96 flex flex-col h-[600px] max-h-[80vh] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-900/20 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-slate-800/50 border-b border-purple-500/20 flex items-center gap-3">
        <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-600/30">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white">Arquitecto AI</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-purple-200">Gemini 2.5 Flash Activo</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-none shadow-lg' 
                  : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-xs text-purple-300">Diseñando estructura...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/30 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: Construye una pirámide azul..."
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-slate-500 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-purple-600 rounded-lg text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="text-[10px] text-center mt-2 text-slate-500 flex items-center justify-center gap-1">
          <Sparkles size={10} />
          Powered by Google Gemini
        </div>
      </div>
    </div>
  );
};