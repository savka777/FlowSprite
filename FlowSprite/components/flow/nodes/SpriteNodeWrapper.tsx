"use client";

import React from "react";
import { RotateCw, Trash2, Play } from "lucide-react";
import { NodeStatus } from "@/lib/flowTypes";

interface SpriteNodeWrapperProps {
  title: string;
  status?: NodeStatus;
  showRedo?: boolean;
  onRedo?: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
  showPlay?: boolean;
  onPlay?: () => void;
  children: React.ReactNode;
}

const statusColors: Record<NodeStatus, string> = {
  idle: "bg-gray-500",
  generating: "bg-yellow-500",
  ready: "bg-green-500",
  error: "bg-red-500",
};

export function SpriteNodeWrapper({
  title,
  status,
  showRedo = false,
  onRedo,
  showDelete = true,
  onDelete,
  showPlay = false,
  onPlay,
  children,
}: SpriteNodeWrapperProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 min-w-[200px]">
      {/* Header with title, status, and action buttons */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`w-2 h-2 rounded-full ${statusColors[status]}`}
              title={status}
            />
          )}
          {showPlay && onPlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-1.5 rounded-full hover:bg-green-50 transition-colors"
              title="Play/Generate"
            >
              <Play className="w-3.5 h-3.5 text-green-600 fill-green-600" />
            </button>
          )}
          {showRedo && onRedo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRedo();
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Regenerate"
            >
              <RotateCw className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
          {showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

