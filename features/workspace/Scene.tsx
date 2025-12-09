import React, { useState, useMemo, useEffect } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, Instances, Instance, PointerLockControls } from '@react-three/drei';
import { EffectComposer, Bloom, TiltShift, Vignette } from '@react-three/postprocessing';
import { VoxelData, Vector3, ToolType, BlockType } from '../../shared/types';
import { playSound } from '../../utils/sound';
import * as THREE from 'three';

interface SceneProps {
  voxels: VoxelData[];
  onAddVoxel: (position: Vector3) => void;
  onRemoveVoxel: (id: string) => void;
  selectedColor: string;
  selectedTool: ToolType;
  selectedBlockType: BlockType;
  firstPersonMode: boolean;
  onExitFirstPerson: () => void;
}

// Procedural Skybox
const StarrySkybox = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
      gradient.addColorStop(0.0, '#020617');
      gradient.addColorStop(1.0, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 4096, 2048);
      
      // Fast Stars
      ctx.fillStyle = 'white';
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 4096;
        const y = Math.random() * 2048;
        ctx.globalAlpha = Math.random();
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[900, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

// Preview Voxel (Ghost)
const PreviewVoxel: React.FC<{ 
  position: Vector3 | null; 
  color: string; 
  type: BlockType;
}> = ({ position, color, type }) => {
  if (!position) return null;
  
  const isGlass = type === BlockType.GLASS;
  const isEmissive = type === BlockType.EMISSIVE;

  return (
    <group position={new THREE.Vector3(...position)}>
      <mesh>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isGlass ? 0.3 : 0.5} 
          wireframe={!isEmissive}
        />
      </mesh>
      {isEmissive && (
        <pointLight color={color} distance={3} intensity={2} />
      )}
    </group>
  );
};

export const Scene: React.FC<SceneProps> = ({ 
  voxels, 
  onAddVoxel, 
  onRemoveVoxel, 
  selectedColor,
  selectedTool,
  selectedBlockType,
  firstPersonMode,
  onExitFirstPerson
}) => {
  const [previewPos, setPreviewPos] = useState<Vector3 | null>(null);

  // Separate voxels by type for InstancedMesh performance optimization
  const { solidVoxels, glassVoxels, emissiveVoxels } = useMemo(() => {
    const solid: VoxelData[] = [];
    const glass: VoxelData[] = [];
    const emissive: VoxelData[] = [];
    
    voxels.forEach(v => {
      if (v.type === BlockType.GLASS) glass.push(v);
      else if (v.type === BlockType.EMISSIVE) emissive.push(v);
      else solid.push(v);
    });
    return { solidVoxels: solid, glassVoxels: glass, emissiveVoxels: emissive };
  }, [voxels]);

  // Logic helpers
  const calculateAdjacentPos = (point: THREE.Vector3, faceNormal: THREE.Vector3): Vector3 => {
     return [
      Math.floor(point.x + faceNormal.x * 0.5 + 0.5),
      Math.floor(point.y + faceNormal.y * 0.5 + 0.5),
      Math.floor(point.z + faceNormal.z * 0.5 + 0.5)
     ];
  };

  const handleInteraction = (e: ThreeEvent<MouseEvent>, id?: string) => {
    e.stopPropagation();
    
    // Remove Logic
    if (selectedTool === ToolType.REMOVE || e.altKey) {
      if (id) {
        onRemoveVoxel(id);
        playSound.delete();
      }
      return;
    }

    // Add Logic
    if (e.face) {
      const newPos = calculateAdjacentPos(e.point, e.face.normal);
      onAddVoxel(newPos);
      playSound.pop();
    }
  };

  const handlePointerMove = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (selectedTool === ToolType.ADD && e.face) {
      const newPos = calculateAdjacentPos(e.point, e.face.normal);
      setPreviewPos(newPos);
    } else {
      setPreviewPos(null);
    }
  };

  return (
    <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }} gl={{ antialias: false, stencil: false, depth: true }}>
      <StarrySkybox />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[20, 40, 20]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0005}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4f46e5" />

      {/* Controls */}
      {firstPersonMode ? (
        <PointerLockControls selector="#root" onUnlock={onExitFirstPerson} />
      ) : (
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 1.9} />
      )}

      {/* Preview Ghost */}
      {selectedTool === ToolType.ADD && !firstPersonMode && (
        <PreviewVoxel 
          position={previewPos} 
          color={selectedColor} 
          type={selectedBlockType}
        />
      )}

      {/* Render Instances: SOLID */}
      <Instances range={10000} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} metalness={0.1} />
        {solidVoxels.map((v) => (
          <Instance
            key={v.id}
            position={v.position}
            color={v.color}
            onClick={(e) => handleInteraction(e, v.id)}
            onPointerMove={handlePointerMove}
          />
        ))}
      </Instances>

      {/* Render Instances: GLASS */}
      <Instances range={5000}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.6} 
          roughness={0.1} 
          metalness={0.1} 
          transmission={0.5} 
          thickness={1}
        />
        {glassVoxels.map((v) => (
          <Instance
            key={v.id}
            position={v.position}
            color={v.color}
            onClick={(e) => handleInteraction(e, v.id)}
            onPointerMove={handlePointerMove}
          />
        ))}
      </Instances>

      {/* Render Instances: EMISSIVE */}
      <Instances range={2000}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          emissiveIntensity={2} 
          toneMapped={false}
        />
        {emissiveVoxels.map((v) => (
          <Instance
            key={v.id}
            position={v.position}
            color={v.color}
            emissive={v.color}
            onClick={(e) => handleInteraction(e, v.id)}
            onPointerMove={handlePointerMove}
          />
        ))}
      </Instances>

      {/* Ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        onClick={(e) => {
          e.stopPropagation();
          if (selectedTool === ToolType.ADD) {
            const x = Math.floor(e.point.x + 0.5);
            const z = Math.floor(e.point.z + 0.5);
            onAddVoxel([x, 0, z]);
            playSound.pop();
          }
        }} 
        onPointerMove={(e) => {
          e.stopPropagation();
          const x = Math.floor(e.point.x + 0.5);
          const z = Math.floor(e.point.z + 0.5);
          setPreviewPos([x, 0, z]);
        }}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      
      <ContactShadows 
        position={[0, -0.49, 0]} 
        opacity={0.5} 
        scale={60} 
        blur={2} 
        far={4.5} 
        color="#000000"
      />
      
      <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.48, 0]} />

      {/* Post Processing Effects - SSAO removed due to NormalPass errors */}
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={1.1} mipmapBlur intensity={0.8} radius={0.4} />
        <TiltShift blur={0.1} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};