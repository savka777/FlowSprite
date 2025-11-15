"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AnimationPreviewNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { Loader2, Play } from "lucide-react";

export function AnimationPreviewNode({
  id,
  data,
}: NodeProps<AnimationPreviewNodeData>) {
  const handleRegenerate = () => {
    if (data.onRegenerate) {
      data.onRegenerate(id);
    } else if (data.onGenerateAnimation) {
      // If onGenerateAnimation is available, use it (it will find the animation node)
      data.onGenerateAnimation(id);
    }
  };

  const handleGenerate = () => {
    if (data.onGenerateAnimation) {
      data.onGenerateAnimation(id);
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
  };

  // Construct video source from base64
  const videoSrc =
    data.videoBase64 && data.mimeType
      ? `data:${data.mimeType};base64,${data.videoBase64}`
      : undefined;

  const canGenerate = data.onGenerateAnimation && data.status !== "generating";
  const hasVideo = !!videoSrc;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <SpriteNodeWrapper
        title="Animation Preview"
        status={data.status}
        showRedo={hasVideo}
        onRedo={handleRegenerate}
        showDelete={true}
        onDelete={handleDelete}
        borderColor="#FF6680" // Scratch pink
      >
        <div className="space-y-2">
          <div className="border border-gray-300 rounded-lg bg-white w-full h-40 flex items-center justify-center overflow-hidden">
            {data.status === "generating" ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-gray-600 text-sm">Generating video...</span>
              </div>
            ) : data.status === "error" ? (
              <div className="flex flex-col items-center justify-center gap-2 p-2">
                <span className="text-red-600 text-sm text-center">
                  Error generating animation
                </span>
                {data.errorMessage && (
                  <span className="text-red-500 text-xs text-center">
                    {data.errorMessage}
                  </span>
                )}
              </div>
            ) : videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                controls
                className="w-full h-full object-contain rounded-lg"
                style={{ backgroundColor: "white" }}
              />
            ) : (
              <span className="text-gray-400 text-sm text-center px-2">
                No animation yet. Connect to an Animation node and generate.
              </span>
            )}
          </div>
          
          {/* Generate button - show when connected to Animation node but no video yet */}
          {canGenerate && !hasVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Generate Video</span>
            </button>
          )}
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

