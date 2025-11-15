"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AnimationNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";

const animationLabels: Record<AnimationNodeData["animationKind"], string> = {
  idle: "Idle Animation",
  walk: "Walk Animation",
  run: "Run Animation",
  jump: "Jump Animation",
};

export function AnimationNode({ data }: NodeProps<AnimationNodeData>) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title={animationLabels[data.animationKind]}
        status={data.status}
      >
        <div className="text-sm text-gray-600">
          <p>Animation type: {data.animationKind}</p>
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

