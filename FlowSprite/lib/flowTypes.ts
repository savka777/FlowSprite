export type NodeStatus = 'idle' | 'generating' | 'ready' | 'error';

export type AnimationKind = 'idle' | 'walk' | 'run' | 'jump';

export interface ReferenceNodeData {
  type: 'reference';
  imageUrl?: string; // For local preview display
  imageBase64?: string; // Base64 encoded image data for API
  mimeType?: string; // MIME type of the image (e.g., "image/png", "image/jpeg")
  onUpdate?: (updates: Partial<ReferenceNodeData>) => void;
  onDelete?: () => void;
}

export interface PromptNodeData {
  type: 'prompt';
  prompt: string;
  onUpdate?: (updates: Partial<PromptNodeData>) => void;
  onDelete?: () => void;
}

export interface PreviewNodeData {
  type: 'preview';
  status: NodeStatus;
  imageUrl?: string;
  onRegenerate?: (nodeId: string) => void;
  onDelete?: () => void;
  onPlay?: () => void;
  hasIncomingEdges?: boolean;
  isConnectedToPromptOrReference?: boolean;
}

export interface AnimationNodeData {
  type: 'animation';
  animationKind: AnimationKind;
  status: NodeStatus;
  onDelete?: () => void;
}

export interface AnimationPreviewNodeData {
  type: 'animationPreview';
  status: NodeStatus;
  onRegenerate?: (nodeId: string) => void;
  onDelete?: () => void;
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

