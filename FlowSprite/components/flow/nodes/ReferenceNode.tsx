"use client";

import React, { useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ReferenceNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { ImageIcon } from "lucide-react";

export function ReferenceNode({ id, data }: NodeProps<ReferenceNodeData>) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // TODO: Upload to backend and get imageUrl
        const imageUrl = URL.createObjectURL(file);
        if (data.onUpdate) {
          data.onUpdate({ imageUrl });
        }
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
        title="Reference"
        showDelete={true}
        onDelete={handleDelete}
      >
        <div className="space-y-2">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`reference-upload-${id}`}
            />
            <div
              onClick={() => document.getElementById(`reference-upload-${id}`)?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors"
            >
              {data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt="Reference"
                  className="w-full h-32 object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

