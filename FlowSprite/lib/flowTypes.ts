export type NodeStatus = 'idle' | 'generating' | 'ready' | 'error';

export type AnimationKind = 'idle' | 'walk' | 'run' | 'jump';

export interface ReferenceNodeData {
  type: 'reference';
  imageUrl?: string;
  onUpdate?: (updates: Partial<ReferenceNodeData>) => void;
}

export interface PromptNodeData {
  type: 'prompt';
  prompt: string;
  onUpdate?: (updates: Partial<PromptNodeData>) => void;
}

export interface PreviewNodeData {
  type: 'preview';
  status: NodeStatus;
  imageUrl?: string;
  onRegenerate?: (nodeId: string) => void;
}

export interface AnimationNodeData {
  type: 'animation';
  animationKind: AnimationKind;
  status: NodeStatus;
}

export interface AnimationPreviewNodeData {
  type: 'animationPreview';
  status: NodeStatus;
  onRegenerate?: (nodeId: string) => void;
}

export type SpriteNodeData =
  | ReferenceNodeData
  | PromptNodeData
  | PreviewNodeData
  | AnimationNodeData
  | AnimationPreviewNodeData;

export type SpriteNodeType =
  | 'reference'
  | 'prompt'
  | 'preview'
  | 'animation'
  | 'animationPreview';

