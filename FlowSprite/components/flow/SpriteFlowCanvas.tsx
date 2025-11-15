"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
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
import { SpriteNodeData } from "@/lib/flowTypes";

const nodeTypes: NodeTypes = {
  reference: ReferenceNode,
  prompt: PromptNode,
  preview: PreviewNode,
  animation: AnimationNode,
  animationPreview: AnimationPreviewNode,
};

interface SpriteFlowCanvasProps {
  nodes: Node<SpriteNodeData>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onRegenerate: (nodeId: string) => void;
}

export function SpriteFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onRegenerate,
}: SpriteFlowCanvasProps) {
  // Update nodes with callbacks (onRegenerate for preview nodes, onUpdate for editable nodes)
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((node) => {
      const nodeData = { ...node.data };
      
      // Add onRegenerate for preview and animationPreview nodes
      if (
        nodeData.type === "preview" ||
        nodeData.type === "animationPreview"
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
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

// Export function to get current graph state
// Filters out callback functions that shouldn't be serialized
export function getGraphState(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map((node) => {
      const { onUpdate, onRegenerate, ...serializableData } = node.data as any;
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

