"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  MiniMap,
  NodeTypes,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { ReferenceNode } from "./nodes/ReferenceNode";
import { PromptNode } from "./nodes/PromptNode";
import { PreviewNode } from "./nodes/PreviewNode";
import { AnimationNode } from "./nodes/AnimationNode";
import { AnimationPreviewNode } from "./nodes/AnimationPreviewNode";
import { CutNode } from "./nodes/CutNode";
import { SpriteFramesPreviewNode } from "./nodes/SpriteFramesPreviewNode";
import { SpriteNodeData } from "@/lib/flowTypes";

const nodeTypes: NodeTypes = {
  reference: ReferenceNode,
  prompt: PromptNode,
  preview: PreviewNode,
  animation: AnimationNode,
  animationPreview: AnimationPreviewNode,
  cut: CutNode,
  spriteFramesPreview: SpriteFramesPreviewNode,
};

interface SpriteFlowCanvasProps {
  nodes: Node<SpriteNodeData>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onRegenerate: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onPlay: (nodeId: string) => void;
}

export function SpriteFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onRegenerate,
  onDeleteNode,
  onPlay,
}: SpriteFlowCanvasProps) {
  // Note: nodes already have callbacks from SpriteFlowPage, but we ensure onRegenerate is set
  // This is a safety measure in case nodes are passed without callbacks
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((node) => {
      const nodeData = { ...node.data };

      // Add onRegenerate for preview and animationPreview nodes if not already set
      if (
        (nodeData.type === "preview" || nodeData.type === "animationPreview") &&
        !nodeData.onRegenerate
      ) {
        return {
          ...node,
          data: {
            ...nodeData,
            onRegenerate,
          },
        };
      }

      return node;
    });
  }, [nodes, onRegenerate]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      onConnect(params);
    },
    [onConnect]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <MiniMap
          style={{
            width: 120,
            height: 80,
          }}
          nodeColor={(node) => {
            const nodeData = node.data as any;
            if (nodeData.type === "reference") return "#4C97FF";
            if (nodeData.type === "prompt") return "#4CBF4F";
            if (nodeData.type === "preview") return "#9966FF";
            if (nodeData.type === "animation") return "#FF8C1A";
            if (nodeData.type === "animationPreview") return "#FF6680";
            if (nodeData.type === "cut") return "#1ABC9C";
            if (nodeData.type === "spriteFramesPreview") return "#3498DB";
            return "#E5E7EB";
          }}
        />
      </ReactFlow>
    </div>
  );
}

// Export function to get current graph state
// Filters out callback functions that shouldn't be serialized
export function getGraphState(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map((node) => {
      const { onUpdate, onRegenerate, onDelete, onPlay, onGenerateAnimation, onCutFrames, hasIncomingEdges, isConnectedToPromptOrReference, isConnectedToPreview, ...serializableData } = node.data as any;
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: serializableData,
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

