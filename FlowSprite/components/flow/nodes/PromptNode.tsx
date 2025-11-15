"use client";

import React, { useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { PromptNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";

export function PromptNode({ id, data }: NodeProps<PromptNodeData>) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (data.onUpdate) {
        data.onUpdate({ prompt: e.target.value });
      }
    },
    [data]
  );

  const handleDelete = useCallback(() => {
    if (data.onDelete) {
      data.onDelete();
    }
  }, [data]);

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper 
        title="Prompt"
        showDelete={true}
        onDelete={handleDelete}
        borderColor="#4CBF4F" // Scratch green
      >
        <textarea
          placeholder="Enter character description..."
          value={data.prompt}
          onChange={handleChange}
          className="w-full min-h-[100px] p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </SpriteNodeWrapper>
    </>
  );
}

