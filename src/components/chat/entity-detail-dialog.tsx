"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityDetailContent } from "./entity-detail-content";
import type { EntityType } from "@/types/entity";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

interface EntityDetailDialogProps {
  entity: string;
  type: EntityType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function EntityDetailDialog({
  entity,
  type,
  open,
  onOpenChange,
}: EntityDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {type === "TOKEN" ? "Token Details" : "Project Details"}
          </DialogTitle>
        </DialogHeader>
        <EntityDetailContent entity={entity} type={type} showToc={false} />
      </DialogContent>
    </Dialog>
  );
}
