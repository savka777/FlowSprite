"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { PreviewNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";

export function PreviewNode({ id, data }: NodeProps<PreviewNodeData>) {
  const handleRegenerate = () => {
    if (data.onRegenerate) {
      data.onRegenerate(id);
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title="Preview"
        status={data.status}
        showRedo={true}
        onRedo={handleRegenerate}
      >
        <div className="space-y-2">
          <div className="border border-gray-300 rounded-lg bg-gray-50 aspect-square flex items-center justify-center">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt="Sprite preview"
                className="w-full h-full object-contain rounded"
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

