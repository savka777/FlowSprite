"use client";

import React, { useCallback } from "react";
import { SpriteFlowCanvas, getGraphState } from "./flow/SpriteFlowCanvas";
import { Node, Edge, NodeChange, EdgeChange, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import { SpriteNodeData, AnimationKind, NodeStatus } from "@/lib/flowTypes";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Type, Eye, Film, Video, Scissors, Grid3x3, Gamepad2, X, PanelRightClose, PanelRightOpen, ArrowRight, Footprints, Zap, ArrowUp, Timer } from "lucide-react";

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

// Demo data structure
interface Demo {
  id: string;
  name: string;
  description: string;
  htmlPath: string;
  thumbnail?: string;
  nodes?: Node<SpriteNodeData>[];
  edges?: Edge[];
}

const demos: Demo[] = [
  {
    id: "sidescroller",
    name: "Sidescroller Game",
    description: "A classic side-scrolling platformer game",
    htmlPath: "/cropped_no_bg/sidescroller.html",
  },
];

export function SpriteFlowPage() {
  const [nodes, setNodes] = React.useState<Node<SpriteNodeData>[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [showDemoGrid, setShowDemoGrid] = React.useState(false);
  const [selectedDemo, setSelectedDemo] = React.useState<Demo | null>(null);
  const [showInspector, setShowInspector] = React.useState(true);
  const [showGameViewer, setShowGameViewer] = React.useState(false);

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

  const handleSaveWorkflow = useCallback(() => {
    try {
      const workflowState = {
        nodes,
        edges,
        timestamp: new Date().toISOString(),
      };
      const serialized = JSON.stringify(workflowState);
      localStorage.setItem('flowsprite_dev_workflow', serialized);
      console.log('Workflow saved:', serialized.length, 'bytes');
      alert('Workflow saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save workflow: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [nodes, edges]);

  const handleLoadWorkflow = useCallback(() => {
    try {
      const saved = localStorage.getItem('flowsprite_dev_workflow');
      if (!saved) {
        alert('No saved workflow found!');
        return;
      }
      console.log('Loading workflow:', saved.length, 'bytes');
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
      setNodes(savedNodes);
      setEdges(savedEdges);
      alert('Workflow loaded successfully!');
    } catch (err) {
      console.error('Load failed:', err);
      alert('Failed to load workflow: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
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
          for (let index = 0; index < previewNodes.length; index++) {
            const node = previewNodes[index];
            if (node.data.type === "preview" && node.data.imageUrl) {
              // Extract base64 from data URL
              const dataUrl = node.data.imageUrl;
              const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (base64Match) {
                const mimeType = base64Match[1];
                let base64 = base64Match[2];
                const extension = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") ? "jpg" : "png";
                const filename = previewNodes.length === 1
                  ? `sprite.${extension}`
                  : `sprite_${index + 1}.${extension}`;

                // Remove background via remove.bg API
                try {
                  const response = await fetch('/api/remove-bg', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    base64 = result.imageBase64;
                    console.log(`Background removed from sprite ${index + 1}`);
                  } else {
                    console.warn(`Background removal failed for sprite ${index + 1}, using original`);
                  }
                } catch (err) {
                  console.error(`Error removing background from sprite ${index + 1}:`, err);
                }

                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length)
                  .fill(0)
                  .map((_, i) => byteCharacters.charCodeAt(i));
                const byteArray = new Uint8Array(byteNumbers);

                characterFolder.file(filename, byteArray);
                hasContent = true;
              }
            }
          }
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
                  animationKind: (animationNode.data as any).animationKind,
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
                    ? { ...n, data: { ...n.data as any, ...updates } }
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
                    ? { ...n, data: { ...n.data as any, ...updates } }
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
                    ? { ...n, data: { ...n.data as any, ...updates } }
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
            (n.data as any).animationKind
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
          ...(node.data as any),
          onDelete: () => handleDeleteNode(node.id),
        },
      };
    });
  }, [nodes, edges, setNodes, handleDeleteNode, handlePlay, handleGenerateAnimation, handleCutFrames]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm transform rotate-3">
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-outfit)' }}>S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-outfit)' }}>
            Sprite<span className="text-green-600">Flow</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 border border-gray-200 hover:border-green-400 hover:text-green-600"
            style={{
              backgroundColor: showInspector ? '#f0fdf4' : 'white',
              color: showInspector ? '#16a34a' : '#374151',
            }}
            title={showInspector ? "Hide Inspector" : "Show Inspector"}
          >
            {showInspector ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            <span className="text-sm">Inspector</span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
          >
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex overflow-hidden relative"
      >

        {/* Canvas Background */}
        <div className="absolute inset-0 z-0">
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

        {/* Left Sidebar - Node Palette (Floating) */}
        <div className="w-64 m-4 z-10 flex flex-col pointer-events-none">
          {/* We use pointer-events-none on the container so clicks pass through to canvas in empty spaces, 
              but we need to re-enable pointer-events on the actual sidebar card */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 p-4 overflow-y-auto pointer-events-auto max-h-[calc(100vh-6rem)]">
            <h2 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
              Node Palette
            </h2>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddNode("reference")}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group"
              >
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                  <ImageIcon className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                </div>
                Reference Image
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddNode("prompt")}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group"
              >
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                  <Type className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                </div>
                Text Prompt
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddNode("preview")}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group"
              >
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                  <Eye className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                </div>
                Preview
              </motion.button>

              <div className="pt-2 mt-2 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 mb-2 px-2 uppercase tracking-wider">Animation</p>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("animation", "idle")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group mb-2"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Timer className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Idle Animation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("animation", "walk")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group mb-2"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Footprints className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Walk Animation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("animation", "run")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group mb-2"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Zap className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Run Animation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("animation", "jump")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group mb-2"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <ArrowUp className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Jump Animation
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("animationPreview")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Video className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Animation Preview
                </motion.button>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 mb-2 px-2 uppercase tracking-wider">Frame Extraction</p>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("cut")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium mb-2 flex items-center gap-3 text-gray-700 hover:text-green-700 group"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Scissors className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Cut to Sprites
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddNode("spriteFramesPreview")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-sm font-medium flex items-center gap-3 text-gray-700 hover:text-green-700 group"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-green-100 transition-colors">
                    <Grid3x3 className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                  </div>
                  Frames Preview
                </motion.button>
              </div>

              {/* Community Demo Button at Bottom */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDemoGrid(true)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all text-sm font-medium flex items-center gap-3"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Community Demo
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Inspector (Floating) */}
        <AnimatePresence mode="wait">
          {showInspector && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-4 top-4 bottom-4 w-80 z-10 pointer-events-none flex flex-col"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 p-4 overflow-y-auto pointer-events-auto h-full">
                <h2 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
                  Inspector
                </h2>
                {selectedNode ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Node ID</label>
                      <p className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100">{selectedNode.id}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Type</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {selectedNode.type}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Position</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-100 text-sm text-gray-600">
                          X: {Math.round(selectedNode.position.x)}
                        </div>
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-100 text-sm text-gray-600">
                          Y: {Math.round(selectedNode.position.y)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data</label>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto max-h-60 font-mono">
                        {JSON.stringify(selectedNode.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Eye className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm">Select a node to inspect its properties</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Grid Modal */}
        {showDemoGrid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-green-600" />
                  Community Demos
                </h2>
                <button
                  onClick={() => setShowDemoGrid(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {demos.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => {
                        if ((demo as any).nodes && (demo as any).edges) {
                          setNodes((demo as any).nodes);
                          setEdges((demo as any).edges);
                        }
                        setShowDemoGrid(false);
                      }}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left border border-gray-100 hover:border-green-200"
                    >
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img
                          src={demo.thumbnail}
                          alt={demo.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-white font-medium text-sm flex items-center gap-2">
                            Load Demo <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{demo.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{demo.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Viewer Modal */}
        {showGameViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-green-400" />
                  Game Preview
                </h2>
                <button
                  onClick={() => setShowGameViewer(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-black relative">
                <iframe
                  src="/game-viewer.html" // You would need to implement this
                  className="w-full h-full border-0"
                  title="Game Viewer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-500 font-mono">Game Viewer Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div >
  );
}
