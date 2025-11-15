"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { PreviewNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { Loader2 } from "lucide-react";

export function PreviewNode({ id, data }: NodeProps<PreviewNodeData>) {
  const handleRegenerate = () => {
    if (data.onRegenerate) {
      data.onRegenerate(id);
    }
  };

  const handlePlay = () => {
    if (data.onPlay) {
      data.onPlay();
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
  };

  const shouldShowPlay = data.onPlay && data.isConnectedToPromptOrReference;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title="Preview"
        status={data.status}
        showRedo={true}
        onRedo={handleRegenerate}
        showPlay={shouldShowPlay}
        onPlay={handlePlay}
        showDelete={true}
        onDelete={handleDelete}
        borderColor="#9966FF" // Scratch purple
      >
        <div className="space-y-2">
          <div className="border border-gray-300 rounded-lg bg-white flex items-center justify-center w-full h-48">
            {data.status === "generating" ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-gray-600 text-sm">Generating...</span>
              </div>
            ) : data.status === "error" ? (
              <div className="flex flex-col items-center justify-center gap-2 p-2">
                <span className="text-red-600 text-sm text-center">
                  Error generating sprite
                </span>
                <span className="text-red-500 text-xs text-center">
                  Check console for details
                </span>
              </div>
            ) : data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt="Sprite preview"
                className="max-w-full max-h-full object-contain rounded"
                style={{ backgroundColor: 'white' }}
              />
            ) : (
              <span className="text-gray-400 text-sm">No sprite yet</span>
            )}
          </div>
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

