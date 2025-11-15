"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { CutNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { Download } from "lucide-react";

export function CutNode({
  id,
  data,
}: NodeProps<CutNodeData>) {
  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
  };

  const handleCutFrames = () => {
    if (data.onCutFrames) {
      data.onCutFrames(id);
    }
  };

  const handleDownloadZip = () => {
    if (!data.zipBase64) return;
    
    const byteCharacters = atob(data.zipBase64);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprite_frames.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isCutting = data.status === "cutting";
  const isReady = data.status === "ready" && data.zipBase64;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title={data.label || "Cut to Sprites"}
        status={data.status}
        showDelete={true}
        onDelete={handleDelete}
        borderColor="#1ABC9C" // Teal for cut node
      >
        <div className="space-y-2">
          {data.status === "error" && data.errorMessage && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {data.errorMessage}
            </div>
          )}

          {data.status === "cutting" && (
            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              Cutting frames...
            </div>
          )}

          {data.status === "ready" && data.frames && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              {data.frames.length} frames ready
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCutFrames();
            }}
            disabled={isCutting}
            className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCutting ? "Cutting..." : "Cut Frames"}
          </button>

          {isReady && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadZip();
              }}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sprites
            </button>
          )}
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

