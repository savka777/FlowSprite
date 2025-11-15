"use client";

import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AnimationNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";

const animationLabels: Record<AnimationNodeData["animationKind"], string> = {
  idle: "Idle Animation",
  walk: "Walk Animation",
  run: "Run Animation",
  jump: "Jump Animation",
};

export function AnimationNode({
  id,
  data,
}: NodeProps<AnimationNodeData>) {
  const [extraPrompt, setExtraPrompt] = useState(data.extraPrompt || "");

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
  };

  const handlePlay = () => {
    if (data.onPlay) {
      // Update extraPrompt in node data before generating
      if (data.onUpdate) {
        data.onUpdate({ extraPrompt });
      }
      data.onPlay();
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrompt = e.target.value;
    setExtraPrompt(newPrompt);
    if (data.onUpdate) {
      data.onUpdate({ extraPrompt: newPrompt });
    }
  };

  const shouldShowPlay = data.onPlay && data.isConnectedToPreview;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title={animationLabels[data.animationKind]}
        status={data.status}
        showPlay={shouldShowPlay}
        onPlay={handlePlay}
        showDelete={true}
        onDelete={handleDelete}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <p>Animation type: {data.animationKind}</p>
          </div>

          {/* Extra prompt input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Optional motion tweak:
            </label>
            <input
              type="text"
              value={extraPrompt}
              onChange={handlePromptChange}
              placeholder="e.g., 'make it faster', 'more bouncy'"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={data.status === "generating"}
            />
          </div>
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

