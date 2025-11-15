"use client";

import React, { useCallback } from "react";
import { SpriteFlowCanvas, getGraphState } from "./flow/SpriteFlowCanvas";
import { Node, Edge, NodeChange, EdgeChange, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import { SpriteNodeData, AnimationKind, NodeStatus } from "@/lib/flowTypes";

const initialNodes: Node<SpriteNodeData>[] = [
  {
    id: "prompt-1",
    type: "prompt",
    position: { x: 100, y: 100 },
    data: {
      type: "prompt",
      prompt: "A cute pixel art character",
    },
  },
  {
    id: "reference-1",
    type: "reference",
    position: { x: 100, y: 250 },
    data: {
      type: "reference",
    },
  },
  {
    id: "preview-1",
    type: "preview",
    position: { x: 400, y: 100 },
    data: {
      type: "preview",
      status: "idle",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "prompt-1",
    target: "preview-1",
  },
];

export function SpriteFlowPage() {
  const [nodes, setNodes] = React.useState<Node<SpriteNodeData>[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const handleAddNode = useCallback((type: string, animationKind?: AnimationKind) => {
    const newNodeId = `${type}-${Date.now()}`;
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    let nodeData: SpriteNodeData;
    switch (type) {
      case "reference":
        nodeData = { type: "reference" };
        break;
      case "prompt":
        nodeData = { type: "prompt", prompt: "" };
        break;
      case "preview":
        nodeData = { type: "preview", status: "idle" };
        break;
      case "animation":
        if (!animationKind) return;
        nodeData = {
          type: "animation",
          animationKind,
          status: "idle",
        };
        break;
      case "animationPreview":
        nodeData = { type: "animationPreview", status: "idle" };
        break;
      default:
        return;
    }

    const newNode: Node<SpriteNodeData> = {
      id: newNodeId,
      type: type as any,
      position,
      data: nodeData,
    };

    setNodes((prev) => [...prev, newNode]);
  }, []);

  const handleExport = useCallback(() => {
    const graphState = getGraphState(nodes, edges);
    console.log("Exporting graph:", JSON.stringify(graphState, null, 2));
    // TODO: Replace with API call to backend
  }, [nodes, edges]);

  const handleRegenerate = useCallback(
    async (nodeId: string) => {
      console.log("Regenerating node:", nodeId);

      // Find the Preview node
      const previewNode = nodes.find((n) => n.id === nodeId);
      if (!previewNode || previewNode.data.type !== "preview") {
        console.warn("Node not found or not a preview node:", nodeId);
        return;
      }

      // Update status to generating
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === nodeId && node.data.type === "preview") {
            return {
              ...node,
              data: {
                ...node.data,
                status: "generating" as NodeStatus,
              },
            };
          }
          return node;
        })
      );

      try {
        // Find all incoming edges to this Preview node
        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        const sourceNodeIds = incomingEdges.map((edge) => edge.source);
        const connectedNodes = nodes.filter((n) => sourceNodeIds.includes(n.id));

        // Extract prompt text from first connected Prompt node
        const promptNode = connectedNodes.find((n) => n.data.type === "prompt");
        const promptText =
          promptNode && promptNode.data.type === "prompt"
            ? promptNode.data.prompt
            : undefined;

        // Extract reference images from connected Reference nodes
        const referenceNodes = connectedNodes.filter((n) => n.data.type === "reference");
        const references: { mimeType: string; base64: string }[] = [];

        for (const refNode of referenceNodes) {
          if (refNode.data.type === "reference" && refNode.data.imageBase64 && refNode.data.mimeType) {
            references.push({
              mimeType: refNode.data.mimeType,
              base64: refNode.data.imageBase64,
            });
          }
        }

        // Extract images from connected Preview nodes (use generated sprites as context)
        const previewNodes = connectedNodes.filter((n) => n.data.type === "preview");
        for (const previewNode of previewNodes) {
          if (previewNode.data.type === "preview" && previewNode.data.imageUrl) {
            // Convert data URL to base64
            // imageUrl format: "data:image/png;base64,<base64data>"
            const dataUrl = previewNode.data.imageUrl;
            const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (base64Match) {
              const mimeType = base64Match[1] || "image/png";
              const base64 = base64Match[2];
              references.push({
                mimeType,
                base64,
              });
            }
          }
        }

        // Generate seed from nodeId for determinism
        let seed = 0;
        for (let i = 0; i < nodeId.length; i++) {
          const char = nodeId.charCodeAt(i);
          seed = (seed << 5) - seed + char;
          seed = seed & seed; // Convert to 32-bit integer
        }
        seed = Math.abs(seed);

        // Call API
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodeId,
            promptText,
            references: references.length > 0 ? references : undefined,
            seed,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          
          // Log quota errors for debugging
          if (response.status === 429) {
            console.error("Quota exceeded:", errorMessage);
            console.warn("You may need to upgrade your Gemini API plan or wait for quota reset.");
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const { imageBase64 } = result;

        // Convert base64 to data URL
        const imageUrl = `data:image/png;base64,${imageBase64}`;

        // Update node with generated image
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === nodeId && node.data.type === "preview") {
              return {
                ...node,
                data: {
                  ...node.data,
                  imageUrl,
                  status: "ready" as NodeStatus,
                },
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error("Error generating preview:", error);
        // Update status to error
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === nodeId && node.data.type === "preview") {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "error" as NodeStatus,
                },
              };
            }
            return node;
          })
        );
      }
    },
    [nodes, edges]
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    // Remove all edges connected to this node
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    // Clear selection if the deleted node was selected
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const handlePlay = useCallback(
    async (nodeId: string) => {
      // Play button triggers the same generation as regenerate
      await handleRegenerate(nodeId);
    },
    [handleRegenerate]
  );

  const handleGenerateAnimation = useCallback(
    async (nodeId: string) => {
      console.log("Generating animation for node:", nodeId);

      // Find the Animation node
      const animationNode = nodes.find(
        (n) => n.id === nodeId && n.data.type === "animation"
      );
      if (!animationNode || animationNode.data.type !== "animation") {
        console.warn("Node not found or not an animation node:", nodeId);
        return;
      }

      // Update status to generating
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === nodeId && node.data.type === "animation") {
            return {
              ...node,
              data: {
                ...node.data,
                status: "generating" as NodeStatus,
              },
            };
          }
          return node;
        })
      );

      // Also update connected AnimationPreview nodes
      const connectedPreviewNodes = edges
        .filter((edge) => edge.source === nodeId)
        .map((edge) => edge.target)
        .map((targetId) => nodes.find((n) => n.id === targetId))
        .filter(
          (node): node is Node<SpriteNodeData> =>
            node !== undefined && node.data.type === "animationPreview"
        );

      setNodes((prev) =>
        prev.map((node) => {
          if (
            connectedPreviewNodes.some((pn) => pn.id === node.id) &&
            node.data.type === "animationPreview"
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                status: "generating" as NodeStatus,
              },
            };
          }
          return node;
        })
      );

      try {
        // Find connected Preview node
        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        const sourceNodeIds = incomingEdges.map((edge) => edge.source);
        const connectedNodes = nodes.filter((n) =>
          sourceNodeIds.includes(n.id)
        );

        const previewNode = connectedNodes.find(
          (n) => n.data.type === "preview"
        );
        if (!previewNode || previewNode.data.type !== "preview") {
          throw new Error("No connected Preview node found");
        }

        // Extract sprite base64
        let spriteBase64: string;
        if (previewNode.data.imageUrl) {
          // Extract from data URL: "data:image/png;base64,<base64>"
          const dataUrl = previewNode.data.imageUrl;
          const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            spriteBase64 = base64Match[1];
          } else {
            throw new Error("Invalid imageUrl format");
          }
        } else {
          throw new Error("Preview node has no image");
        }

        // Call API
        const response = await fetch("/api/animation-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodeId,
            animationKind: animationNode.data.animationKind,
            spriteBase64,
            promptText: animationNode.data.extraPrompt || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Unknown error",
          }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const { videoBase64, mimeType } = result;

        // Update Animation node
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === nodeId && node.data.type === "animation") {
              return {
                ...node,
                data: {
                  ...node.data,
                  videoBase64,
                  mimeType: mimeType || "video/mp4",
                  status: "ready" as NodeStatus,
                },
              };
            }
            return node;
          })
        );

        // Update connected AnimationPreview nodes
        setNodes((prev) =>
          prev.map((node) => {
            if (
              connectedPreviewNodes.some((pn) => pn.id === node.id) &&
              node.data.type === "animationPreview"
            ) {
              return {
                ...node,
                data: {
                  ...node.data,
                  videoBase64,
                  mimeType: mimeType || "video/mp4",
                  status: "ready" as NodeStatus,
                  animationKind: animationNode.data.animationKind,
                },
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error("Error generating animation video:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Update Animation node to error
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === nodeId && node.data.type === "animation") {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "error" as NodeStatus,
                },
              };
            }
            return node;
          })
        );

        // Update connected AnimationPreview nodes to error
        setNodes((prev) =>
          prev.map((node) => {
            if (
              connectedPreviewNodes.some((pn) => pn.id === node.id) &&
              node.data.type === "animationPreview"
            ) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "error" as NodeStatus,
                  errorMessage,
                },
              };
            }
            return node;
          })
        );
      }
    },
    [nodes, edges]
  );

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Add update callbacks to nodes that need them
  const nodesWithCallbacks = React.useMemo(() => {
    return nodes.map((node) => {
      const hasIncomingEdges = edges.some((edge) => edge.target === node.id);
      const incomingSources = edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => edge.source);
      const connectedNodes = nodes.filter((n) => incomingSources.includes(n.id));
      const isConnectedToPromptOrReference = connectedNodes.some(
        (n) => n.data.type === "prompt" || n.data.type === "reference" || 
              (n.data.type === "preview" && n.data.imageUrl) // Preview nodes with generated images
      );

      if (node.data.type === "reference") {
        return {
          ...node,
          data: {
            ...node.data,
            onUpdate: (updates: Partial<typeof node.data>) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
                )
              );
            },
            onDelete: () => handleDeleteNode(node.id),
          },
        };
      }
      if (node.data.type === "prompt") {
        return {
          ...node,
          data: {
            ...node.data,
            onUpdate: (updates: Partial<typeof node.data>) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
                )
              );
            },
            onDelete: () => handleDeleteNode(node.id),
          },
        };
      }
      if (node.data.type === "preview") {
        return {
          ...node,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
            onPlay: hasIncomingEdges && isConnectedToPromptOrReference
              ? () => handlePlay(node.id)
              : undefined,
            hasIncomingEdges,
            isConnectedToPromptOrReference,
          },
        };
      }
      if (node.data.type === "animation") {
        // Check if connected to a Preview node (similar to Preview node checking for Prompt/Reference)
        const animationIncomingEdges = edges.filter((edge) => edge.target === node.id);
        const animationSourceNodeIds = animationIncomingEdges.map((edge) => edge.source);
        const animationConnectedNodes = nodes.filter((n) =>
          animationSourceNodeIds.includes(n.id)
        );
        const isConnectedToPreview = animationConnectedNodes.some(
          (n) => n.data.type === "preview" && n.data.imageUrl
        );

        return {
          ...node,
          data: {
            ...node.data,
            onUpdate: (updates: Partial<typeof node.data>) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
                )
              );
            },
            onDelete: () => handleDeleteNode(node.id),
            onGenerateAnimation: () => handleGenerateAnimation(node.id),
            onPlay: hasIncomingEdges && isConnectedToPreview
              ? () => handleGenerateAnimation(node.id)
              : undefined,
            hasIncomingEdges,
            isConnectedToPreview,
          },
        };
      }
      if (node.data.type === "animationPreview") {
        // Find the connected animation node
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        const sourceNodeIds = incomingEdges.map((edge) => edge.source);
        const animationNode = nodes.find(
          (n) =>
            sourceNodeIds.includes(n.id) &&
            n.data.type === "animation" &&
            n.data.animationKind
        );

        return {
          ...node,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
            onGenerateAnimation: animationNode
              ? () => handleGenerateAnimation(animationNode.id)
              : undefined,
            onRegenerate: animationNode
              ? () => handleGenerateAnimation(animationNode.id)
              : undefined,
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          onDelete: () => handleDeleteNode(node.id),
        },
      };
    });
  }, [nodes, edges, setNodes, handleDeleteNode, handlePlay, handleGenerateAnimation]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">SpriteFlow</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Export
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Node Palette
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => handleAddNode("reference")}
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Reference
            </button>
            <button
              onClick={() => handleAddNode("prompt")}
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Prompt
            </button>
            <button
              onClick={() => handleAddNode("preview")}
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Preview
            </button>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="text-xs text-gray-500 mb-2 px-2">Animations</p>
              <button
                onClick={() => handleAddNode("animation", "idle")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2"
              >
                Idle Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "walk")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2"
              >
                Walk Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "run")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2"
              >
                Run Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "jump")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2"
              >
                Jump Animation
              </button>
            </div>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <button
                onClick={() => handleAddNode("animationPreview")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Animation Preview
              </button>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <SpriteFlowCanvas
            nodes={nodesWithCallbacks}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onRegenerate={handleRegenerate}
            onDeleteNode={handleDeleteNode}
            onPlay={handlePlay}
          />
        </div>

        {/* Right Sidebar - Inspector */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Inspector
          </h2>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Node ID</label>
                <p className="text-sm font-mono text-gray-900">{selectedNode.id}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <p className="text-sm text-gray-900">{selectedNode.type}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Position</label>
                <p className="text-sm text-gray-900">
                  ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data</label>
                <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a node to inspect</p>
          )}
        </div>
      </div>
    </div>
  );
}

