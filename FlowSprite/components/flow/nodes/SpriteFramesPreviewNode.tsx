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
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const THUMBNAILS_VISIBLE = 5; // Number of thumbnails to show at once

  // Reset to first frame when frames change
  useEffect(() => {
    if (data.frames && data.frames.length > 0) {
      setCurrentFrameIndex(0);
      setThumbnailStartIndex(0);
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
    // Auto-scroll thumbnail carousel to show clicked frame
    if (data.frames && data.frames.length > THUMBNAILS_VISIBLE) {
      const maxStart = Math.max(0, data.frames.length - THUMBNAILS_VISIBLE);
      const idealStart = Math.max(0, index - Math.floor(THUMBNAILS_VISIBLE / 2));
      setThumbnailStartIndex(Math.min(idealStart, maxStart));
    }
  };

  const handleThumbnailCarouselPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.frames && data.frames.length > THUMBNAILS_VISIBLE) {
      setThumbnailStartIndex((prev) => Math.max(0, prev - THUMBNAILS_VISIBLE));
    }
  };

  const handleThumbnailCarouselNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.frames && data.frames.length > THUMBNAILS_VISIBLE) {
      const maxStart = Math.max(0, data.frames.length - THUMBNAILS_VISIBLE);
      setThumbnailStartIndex((prev) => Math.min(prev + THUMBNAILS_VISIBLE, maxStart));
    }
  };

  // Get visible thumbnails for carousel
  const visibleThumbnails = data.frames && data.frames.length > 0
    ? data.frames.slice(thumbnailStartIndex, thumbnailStartIndex + THUMBNAILS_VISIBLE)
    : [];

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
                <div className="border-2 border-gray-400 rounded-lg bg-white p-4 flex items-center justify-center min-h-[200px]">
                  {currentFrame && (
                    <img
                      src={`data:image/png;base64,${currentFrame.base64}`}
                      alt={currentFrame.filename}
                      className="max-w-full max-h-48 object-contain"
                    />
                  )}
                </div>
                
                {/* Navigation buttons for main frame */}
                <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={handlePrevious}
                    className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors border-2 border-gray-400 shadow-md ml-2"
                    title="Previous frame"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  <button
                    onClick={handleNext}
                    className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors border-2 border-gray-400 shadow-md mr-2"
                    title="Next frame"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Thumbnail carousel with navigation */}
              {data.frames.length > THUMBNAILS_VISIBLE && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleThumbnailCarouselPrevious}
                    disabled={thumbnailStartIndex === 0}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors border ${
                      thumbnailStartIndex === 0
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-700"
                    }`}
                    title="Previous thumbnails"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  
                  <div className="flex gap-1 flex-1 justify-center">
                    {visibleThumbnails.map((frame, localIndex) => {
                      const globalIndex = thumbnailStartIndex + localIndex;
                      return (
                        <button
                          key={frame.index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFrameClick(globalIndex);
                          }}
                          className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${
                            globalIndex === currentFrameIndex
                              ? "border-blue-500 bg-blue-50 scale-110"
                              : "border-gray-300 bg-white hover:border-gray-400"
                          }`}
                          title={`Frame ${globalIndex + 1}`}
                        >
                          <img
                            src={`data:image/png;base64,${frame.base64}`}
                            alt={frame.filename}
                            className="w-full h-full object-contain rounded"
                          />
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleThumbnailCarouselNext}
                    disabled={thumbnailStartIndex + THUMBNAILS_VISIBLE >= data.frames.length}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors border ${
                      thumbnailStartIndex + THUMBNAILS_VISIBLE >= data.frames.length
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-700"
                    }`}
                    title="Next thumbnails"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Show all thumbnails if there are few enough */}
              {data.frames.length <= THUMBNAILS_VISIBLE && (
                <div className="flex gap-1 justify-center">
                  {data.frames.map((frame, index) => (
                    <button
                      key={frame.index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFrameClick(index);
                      }}
                      className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${
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
              )}
            </div>
          )}
        </div>
      </SpriteNodeWrapper>
    </>
  );
}

