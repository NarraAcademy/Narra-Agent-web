"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export default function InviteModal({
  open,
  setOpen,
  username,
  initInviteCode,
  updateInviteCode,
  loading,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  username: string;
  initInviteCode: string;
  updateInviteCode: (invite_code: string) => void;
  loading: boolean;
}) {
  const t = useTranslations("chat.invite_modal");
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // 生成邀请链接
  const inviteLink = initInviteCode
    ? `${window.location.origin}/invitation/${initInviteCode}`
    : "";

  // 复制邀请链接
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // 发送邮件邀请
  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setSendingEmail(true);
    try {
      // TODO: 实现邮件发送接口
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Invitation sent!");
      setEmail("");
    } catch (err) {
      toast.error("Failed to send invitation");
    } finally {
      setSendingEmail(false);
    }
  };

  // 模拟的统计数据，实际应该从后端获取
  const stats = {
    referrals: 0,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0">
        {/* 顶部图标和标题 */}
        <DialogHeader className="px-6 pt-6 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* 分享邀请链接 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("share_link_label")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1 bg-muted"
              />
              <Button
                onClick={handleCopy}
                variant="default"
                className="shrink-0 gap-2"
              >
                <CopyIcon className="w-4 h-4" />
                {t("copy")}
              </Button>
            </div>
          </div>

          {/* 邮箱邀请 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("email_label")}</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                variant="default"
                className="shrink-0 gap-2"
              >
                <PaperPlaneIcon className="w-4 h-4" />
                {t("send")}
              </Button>
            </div>
          </div>

          {/* 邀请历史统计 */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              {t("invitation_history")}
            </p>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{stats.referrals}</div>
                <div className="text-sm text-muted-foreground">
                  {t("referrals")}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 底部链接 */}
          <div className="flex items-center justify-between text-sm pt-2">
            <Button variant="link" className="p-0 h-auto text-primary">
              {t("redeem")}
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-primary flex items-center gap-1"
            >
              {t("view_history")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
