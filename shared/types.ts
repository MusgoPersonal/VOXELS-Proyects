export type Vector3 = [number, number, number];

export enum BlockType {
  SOLID = 'SOLID',
  GLASS = 'GLASS',
  EMISSIVE = 'EMISSIVE'
}

export interface VoxelData {
  id: string;
  position: Vector3;
  color: string;
  type: BlockType;
}

export enum ToolType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export interface ArchitectResponse {
  message: string;
  voxels?: Array<{
    x: number;
    y: number;
    z: number;
    color: string;
    type?: BlockType;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isSystem?: boolean;
}