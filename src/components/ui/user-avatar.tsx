"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: User | null;
  role?: "user" | "ai";
  className?: string;
}

/**
 * 统一的用户头像组件
 *
 * 用户模式：
 * - 优先显示 Google 头像（user.avatar_url）
 * - 没有头像则显示用户名首字母（大写）
 * - 都没有则显示默认 "U"
 *
 * AI 模式：
 * - 显示渐变色背景 + "AI" 文字
 */
export function UserAvatar({ user, role = "user", className }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // AI 头像
  if (role === "ai") {
    return (
      <Avatar className={cn("w-8 h-8 shrink-0", className)}>
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          AI
        </AvatarFallback>
      </Avatar>
    );
  }

  // 用户头像
  const avatarUrl = user?.avatar_url;
  const fallbackText = user?.nickname?.charAt(0).toUpperCase() || "U";

  return (
    <Avatar className={cn("w-8 h-8 shrink-0", className)}>
      {avatarUrl && !imageError && (
        <AvatarImage
          src={avatarUrl}
          alt={user?.nickname || "User"}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
