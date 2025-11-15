"use client";

import React, { useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ReferenceNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { ImageIcon } from "lucide-react";

export function ReferenceNode({ id, data, width, height }: NodeProps<ReferenceNodeData>) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Create local preview URL
        const imageUrl = URL.createObjectURL(file);
        
        // Read file as base64 for API
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 data (remove data URL prefix)
          const base64 = result.split(",")[1];
          const mimeType = file.type || "image/png";
          
          if (data.onUpdate) {
            data.onUpdate({
              imageUrl,
              imageBase64: base64,
              mimeType,
            });
          }
        };
        reader.onerror = () => {
          console.error("Error reading file");
          // Still update with imageUrl for preview even if base64 fails
          if (data.onUpdate) {
            data.onUpdate({ imageUrl });
          }
        };
        reader.readAsDataURL(file);
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
        borderColor="#4C97FF" // Scratch blue
        width={width}
        height={height}
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

