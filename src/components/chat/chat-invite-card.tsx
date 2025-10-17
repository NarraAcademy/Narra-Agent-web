"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRightIcon, Share2Icon } from "@radix-ui/react-icons";
import { useAppContext } from "@/contexts/app";
import InviteModal from "@/components/invite/modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ChatInviteCard({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("chat.invite_card");
  const { user, setUser } = useAppContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 未登录时不显示
  if (!user) {
    return null;
  }

  const updateInviteCode = async function (invite_code: string) {
    try {
      invite_code = invite_code.trim();

      if (!invite_code) {
        toast.error("invite code is required");
        return;
      }

      setLoading(true);
      const req = {
        invite_code,
      };
      const resp = await fetch("/api/update-invite-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite code faild with status " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      setUser(data);
      toast.success("set invite code success");
      setOpen(false);
    } catch (e) {
      console.log("update invite code failed", e);
      toast.error("set invite code failed");
    } finally {
      setLoading(false);
    }
  };

  // 折叠状态：只显示图标按钮
  if (collapsed) {
    return (
      <>
        <Share2Icon
          onClick={() => setOpen(true)}
          className="w-5 h-5 shrink-0"
        />
        <InviteModal
          open={open}
          setOpen={setOpen}
          username={user.nickname}
          initInviteCode={user.invite_code || ""}
          updateInviteCode={updateInviteCode}
          loading={loading}
        />
      </>
    );
  }

  // 展开状态：完整卡片
  return (
    <>
      <div
        className="mb-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("subtitle")}
            </p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>

      <InviteModal
        open={open}
        setOpen={setOpen}
        username={user.nickname}
        initInviteCode={user.invite_code || ""}
        updateInviteCode={updateInviteCode}
        loading={loading}
      />
    </>
  );
}
