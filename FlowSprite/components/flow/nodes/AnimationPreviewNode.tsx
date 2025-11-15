"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AnimationPreviewNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";

export function AnimationPreviewNode({
  id,
  data,
}: NodeProps<AnimationPreviewNodeData>) {
  const handleRegenerate = () => {
    if (data.onRegenerate) {
      data.onRegenerate(id);
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <SpriteNodeWrapper
        title="Animation Preview"
        status={data.status}
        showRedo={true}
        onRedo={handleRegenerate}
      >
        <div className="space-y-2">
          <div className="border border-gray-300 rounded-lg bg-gray-50 aspect-video flex items-center justify-center">
            <span className="text-gray-400 text-sm">Animation preview</span>
          </div>
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

