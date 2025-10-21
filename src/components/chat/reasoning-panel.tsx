"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "./chat-context";
import { WorkflowStepCard } from "./workflow-step-card";
import { MetadataDisplay } from "./metadata-display";
import { ChevronDownIcon, ChevronUpIcon, SymbolIcon } from "@radix-ui/react-icons";

interface ReasoningPanelProps {
  message: Message;
  isGenerating?: boolean; // 是否正在生成中
}

export function ReasoningPanel({ message, isGenerating = false }: ReasoningPanelProps) {
  // 自动展开逻辑：正在生成中时展开，否则使用手动状态
  const [manualToggle, setManualToggle] = useState<boolean | null>(null);
  const showReasoning = manualToggle !== null ? manualToggle : isGenerating;

  // 如果没有步骤数据，不显示
  if (!message.steps || message.steps.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      {/* 折叠按钮 */}
      <button
        onClick={() => setManualToggle(!showReasoning)}
        className="flex items-center gap-1.5 text-lg text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {showReasoning ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
        <span className="font-medium">推理过程</span>
      </button>

      {/* Reasoning content - Sequential fade-in animation */}
      <AnimatePresence initial={false}>
        {showReasoning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: {
                height: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
              }
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                height: { duration: 0.35, ease: "easeIn" },
                opacity: { duration: 0.25 }
              }
            }}
            className="overflow-hidden"
          >
            <motion.div
              className="mt-2 space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.08
                  }
                }
              }}
            >
              {/* Workflow steps list - Simple fade-in */}
              {message.steps.map((step) => (
                <motion.div
                  key={step.id}
                  variants={{
                    hidden: { opacity: 0, y: -12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.45,
                        ease: [0.25, 0.1, 0.25, 1]
                      }
                    }
                  }}
                >
                  <WorkflowStepCard step={step} />
                </motion.div>
              ))}

              {/* Metadata display */}
              {message.metadata && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: -12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.45,
                        ease: [0.25, 0.1, 0.25, 1]
                      }
                    }
                  }}
                >
                  <MetadataDisplay metadata={message.metadata} />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
