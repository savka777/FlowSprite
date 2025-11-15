"use client";

import React, { useCallback } from "react";
import { SpriteFlowCanvas, getGraphState } from "./flow/SpriteFlowCanvas";
import { Node, Edge, NodeChange, EdgeChange, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import { SpriteNodeData, AnimationKind, NodeStatus } from "@/lib/flowTypes";
import { ImageIcon, Type, Eye, Film, Video, Scissors, Grid3x3 } from "lucide-react";

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
      case "cut":
        nodeData = { type: "cut", label: "Cut to Sprites", status: "idle" };
        break;
      case "spriteFramesPreview":
        nodeData = { type: "spriteFramesPreview", label: "Sprite Frames Preview", status: "idle" };
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

  const handleExport = useCallback(async () => {
    try {
      // Import JSZip dynamically (it's a large library)
      const JSZip = (await import("jszip")).default;

      const zip = new JSZip();
      let hasContent = false;

      // Collect all Preview nodes with generated sprites
      const previewNodes = nodes.filter(
        (n) => n.data.type === "preview" && n.data.imageUrl && n.data.status === "ready"
      );

      if (previewNodes.length > 0) {
        const characterFolder = zip.folder("character");
        if (characterFolder) {
          previewNodes.forEach((node, index) => {
            if (node.data.type === "preview" && node.data.imageUrl) {
              // Extract base64 from data URL
              const dataUrl = node.data.imageUrl;
              const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (base64Match) {
                const mimeType = base64Match[1];
                const base64 = base64Match[2];
                const extension = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") ? "jpg" : "png";
                const filename = previewNodes.length === 1 
                  ? `sprite.${extension}` 
                  : `sprite_${index + 1}.${extension}`;
                
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length)
                  .fill(0)
                  .map((_, i) => byteCharacters.charCodeAt(i));
                const byteArray = new Uint8Array(byteNumbers);
                
                characterFolder.file(filename, byteArray);
                hasContent = true;
              }
            }
          });
        }
      }

      // Collect all Cut nodes with frames
      const cutNodes = nodes.filter(
        (n) => n.data.type === "cut" && n.data.frames && n.data.frames.length > 0 && n.data.status === "ready"
      );

      if (cutNodes.length > 0) {
        cutNodes.forEach((cutNode, cutIndex) => {
          if (cutNode.data.type === "cut" && cutNode.data.frames) {
            const framesFolder = zip.folder(
              cutNodes.length === 1 ? "frames" : `frames_${cutIndex + 1}`
            );
            if (framesFolder) {
              cutNode.data.frames.forEach((frame) => {
                const byteCharacters = atob(frame.base64);
                const byteNumbers = new Array(byteCharacters.length)
                  .fill(0)
                  .map((_, i) => byteCharacters.charCodeAt(i));
                const byteArray = new Uint8Array(byteNumbers);
                framesFolder.file(frame.filename, byteArray);
                hasContent = true;
              });
            }
          }
        });
      }

      if (!hasContent) {
        alert("No sprites or frames to export. Please generate at least one sprite or cut frames first.");
        return;
      }

      // Generate and download ZIP
      const zipBuffer = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBuffer);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spriteflow_export_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export. Please try again.");
    }
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

  const handleCutFrames = useCallback(
    async (nodeId: string) => {
      console.log("Cutting frames for node:", nodeId);

      // Update status to cutting
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId && node.type === "cut"
            ? {
                ...node,
                data: {
                  ...(node.data as any),
                  status: "cutting" as NodeStatus,
                  errorMessage: undefined,
                },
              }
            : node
        )
      );

      const cutNode = nodes.find((n) => n.id === nodeId);
      if (!cutNode) return;

      // Find connected animation node or animationPreview node
      const incoming = edges.filter((e) => e.target === nodeId);
      const sourceIds = incoming.map((e) => e.source);
      
      // Try to find Animation node first
      let sourceNode = nodes.find(
        (n) => sourceIds.includes(n.id) && n.data.type === "animation"
      );
      
      // If not found, try AnimationPreview node
      if (!sourceNode) {
        sourceNode = nodes.find(
          (n) => sourceIds.includes(n.id) && n.data.type === "animationPreview"
        );
      }

      // Check if we have a valid source node with video
      let videoBase64: string | undefined;
      if (sourceNode) {
        if (sourceNode.data.type === "animation" && sourceNode.data.videoBase64) {
          videoBase64 = sourceNode.data.videoBase64;
        } else if (sourceNode.data.type === "animationPreview" && sourceNode.data.videoBase64) {
          videoBase64 = sourceNode.data.videoBase64;
        }
      }

      if (!videoBase64) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...(node.data as any),
                    status: "error" as NodeStatus,
                    errorMessage: "No animation video connected.",
                  },
                }
              : node
          )
        );
        return;
      }

      try {
        const res = await fetch("/api/cut-frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodeId, videoBase64 }),
        });

        const json = await res.json();

        if (!res.ok || !json.frames) {
          throw new Error(json.error || "Failed to cut frames");
        }

        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === nodeId && node.type === "cut") {
              return {
                ...node,
                data: {
                  ...(node.data as any),
                  status: "ready" as NodeStatus,
                  frames: json.frames,
                  zipBase64: json.zipBase64,
                },
              };
            }
            // Also update connected spriteFramesPreview nodes
            if (
              node.type === "spriteFramesPreview" &&
              edges.some((e) => e.source === nodeId && e.target === node.id)
            ) {
              return {
                ...node,
                data: {
                  ...(node.data as any),
                  status: "ready" as NodeStatus,
                  frames: json.frames,
                },
              };
            }
            return node;
          })
        );
      } catch (err: any) {
        console.error("Error cutting frames:", err);
        setNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId && node.type === "cut"
              ? {
                  ...node,
                  data: {
                    ...(node.data as any),
                    status: "error" as NodeStatus,
                    errorMessage: err?.message || "Failed to cut frames",
                  },
                }
              : node
          )
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
      if (node.data.type === "cut") {
        return {
          ...node,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
            onCutFrames: () => handleCutFrames(node.id),
          },
        };
      }
      if (node.data.type === "spriteFramesPreview") {
        return {
          ...node,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
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
  }, [nodes, edges, setNodes, handleDeleteNode, handlePlay, handleGenerateAnimation, handleCutFrames]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Sprite<span 
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              color: '#FFD700',
              WebkitTextStroke: '0.3px black',
              textShadow: '0.5px 0.5px 0px black',
            }}
          >
            Flow
          </span>
        </h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: '#FFD700',
            color: '#000000',
            border: '2px solid #000000',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFE44D';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFD700';
          }}
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
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Reference
            </button>
            <button
              onClick={() => handleAddNode("prompt")}
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              Prompt
            </button>
            <button
              onClick={() => handleAddNode("preview")}
              className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="text-xs text-gray-500 mb-2 px-2">Animations</p>
              <button
                onClick={() => handleAddNode("animation", "idle")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Idle Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "walk")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Walk Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "run")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Run Animation
              </button>
              <button
                onClick={() => handleAddNode("animation", "jump")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Jump Animation
              </button>
            </div>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <button
                onClick={() => handleAddNode("animationPreview")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Animation Preview
              </button>
            </div>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="text-xs text-gray-500 mb-2 px-2">Frame Extraction</p>
              <button
                onClick={() => handleAddNode("cut")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-2 flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Cut to Sprites
              </button>
              <button
                onClick={() => handleAddNode("spriteFramesPreview")}
                className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Sprite Frames Preview
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

