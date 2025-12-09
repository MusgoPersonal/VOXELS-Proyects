import React, { useState } from 'react';
import { PALETTE } from '../../shared/constants';
import { ToolType, BlockType } from '../../shared/types';
import { Box, Eraser, Trash2, Undo, ChevronUp, ChevronDown, Download, Eye, Zap, Droplets, Cuboid } from 'lucide-react';
import { playSound } from '../../utils/sound';

interface ToolbarProps {
  selectedColor: string;
  onSelectColor: (c: string) => void;
  selectedTool: ToolType;
  onSelectTool: (t: ToolType) => void;
  selectedBlockType: BlockType;
  onSelectBlockType: (t: BlockType) => void;
  onClear: () => void;
  onUndo: () => void;
  onExport: () => void;
  onToggleFPS: () => void;
  voxelCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedColor,
  onSelectColor,
  selectedTool,
  onSelectTool,
  selectedBlockType,
  onSelectBlockType,
  onClear,
  onUndo,
  onExport,
  onToggleFPS,
  voxelCount
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);

  const handleToolClick = (tool: ToolType) => {
    onSelectTool(tool);
    playSound.click();
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-full max-w-3xl px-4 pointer-events-none">
      
      {/* Popovers Wrapper */}
      <div className="flex justify-center gap-4 w-full pointer-events-auto">
        
        {/* Colors Popover */}
        <div className={`transition-all duration-300 origin-bottom mb-2 ${isPaletteOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 h-0 overflow-hidden'}`}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-3 rounded-2xl shadow-2xl">
            <div className="grid grid-cols-6 gap-2">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onSelectColor(color);
                    setIsPaletteOpen(false);
                    playSound.click();
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Materials Popover */}
        <div className={`transition-all duration-300 origin-bottom mb-2 ${isMaterialOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 h-0 overflow-hidden'}`}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl flex gap-2">
            {[
              { type: BlockType.SOLID, icon: Cuboid, label: 'Sólido' },
              { type: BlockType.GLASS, icon: Droplets, label: 'Cristal' },
              { type: BlockType.EMISSIVE, icon: Zap, label: 'Neón' },
            ].map((mat) => (
              <button
                key={mat.type}
                onClick={() => {
                  onSelectBlockType(mat.type);
                  setIsMaterialOpen(false);
                  playSound.click();
                }}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 min-w-[60px] ${selectedBlockType === mat.type ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <mat.icon size={20} />
                <span className="text-[10px]">{mat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dock */}
      <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl overflow-x-auto max-w-full">
        
        {/* Tools */}
        <div className="flex bg-slate-800/50 rounded-xl p-1 gap-1">
          <button
            onClick={() => handleToolClick(ToolType.ADD)}
            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 min-w-[50px] ${selectedTool === ToolType.ADD ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <Box size={20} />
          </button>
          
          <button
            onClick={() => handleToolClick(ToolType.REMOVE)}
            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 min-w-[50px] ${selectedTool === ToolType.REMOVE ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <Eraser size={20} />
          </button>
        </div>

        <div className="w-px h-8 bg-slate-700 mx-2" />

        {/* Color Toggle */}
        <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="relative group p-1 rounded-xl hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: selectedColor }} />
          <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700">
            {isPaletteOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </div>
        </button>

        {/* Material Toggle */}
        <button onClick={() => setIsMaterialOpen(!isMaterialOpen)} className="relative group p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-300">
           {selectedBlockType === BlockType.SOLID && <Cuboid size={24} />}
           {selectedBlockType === BlockType.GLASS && <Droplets size={24} />}
           {selectedBlockType === BlockType.EMISSIVE && <Zap size={24} />}
           <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700 text-white">
            {isMaterialOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </div>
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2" />

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={onUndo} className="p-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white" title="Deshacer"><Undo size={20} /></button>
          <button onClick={onClear} className="p-3 rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400" title="Limpiar"><Trash2 size={20} /></button>
          <button onClick={onExport} className="p-3 rounded-xl text-slate-400 hover:bg-green-900/30 hover:text-green-400" title="Exportar GLTF"><Download size={20} /></button>
          <button onClick={onToggleFPS} className="p-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white" title="Modo Primera Persona"><Eye size={20} /></button>
        </div>

        <div className="w-px h-8 bg-slate-700 mx-2" />

        <div className="px-2 flex flex-col items-center min-w-[50px]">
          <span className="text-lg font-bold text-white leading-none">{voxelCount}</span>
          <span className="text-[9px] text-slate-500 font-mono">BLOQUES</span>
        </div>
      </div>
    </div>
  );
};