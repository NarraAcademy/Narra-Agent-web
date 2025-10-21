"use client";

import React from "react";
import { ReasoningStep } from "./chat-context";

interface ReasoningItemProps {
  reasoning: ReasoningStep;
}

// Format timestamp to readable format
const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
};

const ReasoningItemComponent = ({ reasoning }: ReasoningItemProps) => {
  const formattedTime = formatTimestamp(reasoning.timestamp);

  return (
    <div
      className="flex gap-2 py-1 group"
      title={formattedTime || undefined}
    >
      {/* Solid dot indicator */}
      <div className="w-3 h-3 shrink-0 mt-0.5 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Reasoning content - Only shown when content exists */}
        {reasoning.content && (
          <div className="text-xs text-foreground/80 leading-relaxed">
            {reasoning.content}
          </div>
        )}

        {/* Metadata - Only show fields with values */}
        {reasoning.metadata && (
          <>
            {reasoning.metadata.url && (
              <a
                href={reasoning.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit link: ${reasoning.metadata.url}`}
                title={reasoning.metadata.url}
                className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded truncate block mt-0.5"
              >
                {reasoning.metadata.url}
              </a>
            )}
            {reasoning.metadata.duration !== undefined && (
              <span className="text-xs text-muted-foreground">
                {reasoning.metadata.duration.toFixed(2)}s
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Use React.memo to optimize performance and prevent unnecessary re-renders
export const ReasoningItem = React.memo(ReasoningItemComponent);
