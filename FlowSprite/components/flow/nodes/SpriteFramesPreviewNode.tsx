"use client";

import React, { useState, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { SpriteFramesPreviewNodeData } from "@/lib/flowTypes";
import { SpriteNodeWrapper } from "./SpriteNodeWrapper";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SpriteFramesPreviewNode({
  id,
  data,
}: NodeProps<SpriteFramesPreviewNodeData>) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Reset to first frame when frames change
  useEffect(() => {
    if (data.frames && data.frames.length > 0) {
      setCurrentFrameIndex(0);
    }
  }, [data.frames?.length]);

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.frames && data.frames.length > 0) {
      setCurrentFrameIndex((prev) => 
        prev === 0 ? data.frames!.length - 1 : prev - 1
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.frames && data.frames.length > 0) {
      setCurrentFrameIndex((prev) => 
        prev === data.frames!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleFrameClick = (index: number) => {
    setCurrentFrameIndex(index);
  };

  const currentFrame = data.frames && data.frames.length > 0 
    ? data.frames[currentFrameIndex] 
    : null;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <SpriteNodeWrapper
        title={data.label || "Sprite Frames Preview"}
        status={data.status}
        showDelete={true}
        onDelete={handleDelete}
        borderColor="#3498DB" // Blue for frames preview node
      >
        <div className="space-y-2">
          {data.status === "error" && data.errorMessage && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {data.errorMessage}
            </div>
          )}

          {data.status === "idle" && (
            <div className="text-xs text-gray-500 text-center py-4">
              Connect a Cut node and generate frames.
            </div>
          )}

          {data.status === "ready" && data.frames && data.frames.length > 0 && (
            <div className="space-y-3">
              {/* Frame counter */}
              <div className="text-xs text-gray-600 font-medium text-center">
                Frame {currentFrameIndex + 1} of {data.frames.length}
              </div>

              {/* Main frame display with navigation */}
              <div className="relative">
                <div className="border-2 border-gray-400 rounded-lg bg-white p-3 flex items-center justify-center min-h-[120px]">
                  {currentFrame && (
                    <img
                      src={`data:image/png;base64,${currentFrame.base64}`}
                      alt={currentFrame.filename}
                      className="max-w-full max-h-24 object-contain"
                    />
                  )}
                </div>
                
                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={handlePrevious}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors border-2 border-gray-400"
                    title="Previous frame"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  
                  <span className="text-xs text-gray-600 font-medium">
                    {currentFrameIndex + 1} / {data.frames.length}
                  </span>
                  
                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors border-2 border-gray-400"
                    title="Next frame"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                {data.frames.map((frame, index) => (
                  <button
                    key={frame.index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFrameClick(index);
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded border-2 transition-all ${
                      index === currentFrameIndex
                        ? "border-blue-500 bg-blue-50 scale-110"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    title={`Frame ${index + 1}`}
                  >
                    <img
                      src={`data:image/png;base64,${frame.base64}`}
                      alt={frame.filename}
                      className="w-full h-full object-contain rounded"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

