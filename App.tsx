import React, { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Scene } from './features/workspace/Scene';
import { Toolbar } from './features/toolbox/Toolbar';
import { ArchitectPanel } from './features/architect/ArchitectPanel';
import { VoxelData, Vector3, ToolType, BlockType } from './shared/types';
import { PALETTE } from './shared/constants';
import { v4 as uuidv4 } from 'uuid';
import { playSound } from './utils/sound';

const App: React.FC = () => {
  // Load from local storage or default empty
  const [voxels, setVoxels] = useState<VoxelData[]>(() => {
    const saved = localStorage.getItem('voxel-verse-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [history, setHistory] = useState<VoxelData[][]>([]);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.ADD);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>(BlockType.SOLID);
  const [firstPersonMode, setFirstPersonMode] = useState(false);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('voxel-verse-data', JSON.stringify(voxels));
  }, [voxels]);

  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, voxels];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
  }, [voxels]);

  const handleAddVoxel = useCallback((position: Vector3) => {
    // Sanity check coordinates
    const alignedPos: Vector3 = [
      Math.round(position[0]),
      Math.round(position[1]),
      Math.round(position[2])
    ];

    const exists = voxels.some(v => 
      v.position[0] === alignedPos[0] && 
      v.position[1] === alignedPos[1] && 
      v.position[2] === alignedPos[2]
    );
    
    if (exists) return;

    saveHistory();
    const newVoxel: VoxelData = {
      id: uuidv4(),
      position: alignedPos,
      color: selectedColor,
      type: selectedBlockType
    };
    setVoxels(prev => [...prev, newVoxel]);
  }, [voxels, selectedColor, selectedBlockType, saveHistory]);

  const handleRemoveVoxel = useCallback((id: string) => {
    saveHistory();
    setVoxels(prev => prev.filter(v => v.id !== id));
  }, [saveHistory]);

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      const newHistory = prev.slice(0, -1);
      setVoxels(previousState);
      playSound.pop();
      return newHistory;
    });
  }, []);

  const handleClear = useCallback(() => {
    saveHistory();
    setVoxels([]);
    playSound.delete();
  }, [saveHistory]);

  const handleApplyStructure = useCallback((newVoxels: VoxelData[]) => {
    saveHistory();
    setVoxels(prev => {
      const alignedNewVoxels = newVoxels.map(v => ({
        ...v,
        position: [Math.round(v.position[0]), Math.round(v.position[1]), Math.round(v.position[2])] as Vector3,
        type: v.type || BlockType.SOLID
      }));

      const cleanNew = alignedNewVoxels.filter(nv => 
        !prev.some(ov => 
          ov.position[0] === nv.position[0] && 
          ov.position[1] === nv.position[1] && 
          ov.position[2] === nv.position[2]
        )
      );
      
      if (cleanNew.length > 0) playSound.pop();
      return [...prev, ...cleanNew];
    });
  }, [saveHistory]);

  const handleExport = useCallback(() => {
    // Create a temporary scene for export
    const scene = new THREE.Scene();
    voxels.forEach(v => {
      const geo = new THREE.BoxGeometry(1,1,1);
      const mat = new THREE.MeshStandardMaterial({ color: v.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...v.position);
      scene.add(mesh);
    });

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'voxel-model.gltf';
        link.click();
        playSound.click();
      },
      (err) => console.error(err),
      {}
    );
  }, [voxels]);

  return (
    <div className="w-full h-screen relative bg-slate-900">
      
      <div className="absolute inset-0 z-0">
        <Scene 
          voxels={voxels} 
          onAddVoxel={handleAddVoxel}
          onRemoveVoxel={handleRemoveVoxel}
          selectedColor={selectedColor}
          selectedTool={selectedTool}
          selectedBlockType={selectedBlockType}
          firstPersonMode={firstPersonMode}
          onExitFirstPerson={() => setFirstPersonMode(false)}
        />
      </div>

      {!firstPersonMode && (
        <>
          <Toolbar 
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            selectedBlockType={selectedBlockType}
            onSelectBlockType={setSelectedBlockType}
            onClear={handleClear}
            onUndo={handleUndo}
            onExport={handleExport}
            onToggleFPS={() => {
              setFirstPersonMode(true);
              playSound.click();
            }}
            voxelCount={voxels.length}
          />

          <ArchitectPanel onApplyStructure={handleApplyStructure} />
        </>
      )}

      {firstPersonMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur pointer-events-none">
          MODO PRIMERA PERSONA (WASD para mover, ESC para salir)
        </div>
      )}
    </div>
  );
};

export default App;