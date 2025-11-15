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
  label?: string;
  animationKind: AnimationKind;
  status: NodeStatus;
  videoBase64?: string; // MP4 as base64 (no data: prefix)
  mimeType?: string; // e.g. "video/mp4"
  extraPrompt?: string; // optional user text to tweak motion
  onUpdate?: (updates: Partial<AnimationNodeData>) => void;
  onDelete?: () => void;
  onGenerateAnimation?: (nodeId: string) => void;
  onPlay?: () => void;
  hasIncomingEdges?: boolean;
  isConnectedToPreview?: boolean;
}

export interface AnimationPreviewNodeData {
  type: 'animationPreview';
  label?: string;
  animationKind?: AnimationKind;
  status: NodeStatus;
  videoBase64?: string;
  mimeType?: string;
  errorMessage?: string;
  onRegenerate?: (nodeId: string) => void;
  onDelete?: () => void;
  onGenerateAnimation?: (animationNodeId: string) => void;
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

