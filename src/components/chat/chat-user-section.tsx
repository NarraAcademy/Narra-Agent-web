"use client";

import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";
import SignIn from "@/components/sign/sign_in";
import { isAuthEnabled } from "@/lib/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ChatInviteCard } from "./chat-invite-card";
import { ChatUserMenu } from "./chat-user-menu";
import {
  PersonIcon,
  RocketIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "next-intl";

export function ChatUserSection({ collapsed = false }: { collapsed?: boolean }) {
  const { user, setShowSignModal } = useAppContext();
  const t = useTranslations("chat.user_menu");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  if (!isAuthEnabled()) {
    return null;
  }

  // 未登录状态：显示登录按钮
  if (!user) {
    if (collapsed) {
      // 折叠状态：只显示用户图标
      return (
        <div className="mt-auto border-t border-border p-2 flex justify-center">
          <PersonIcon
            className="w-5 h-5 cursor-pointer shrink-0 hover:text-primary transition-colors"
            onClick={() => setShowSignModal(true)}
          />
        </div>
      );
    }

    // 展开状态：完整登录按钮
    return (
      <div className="p-3 mt-auto">
        <SignIn className="w-full" />
      </div>
    );
  }

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const themes = [
    { value: "light", label: t("theme_light"), icon: SunIcon },
    { value: "dark", label: t("theme_dark"), icon: MoonIcon },
    { value: "system", label: t("theme_system"), icon: DesktopIcon },
  ];

  const languages = [
    { value: "zh", label: t("language_zh") },
    { value: "en", label: t("language_en") },
  ];

  // 已登录 - 折叠状态：垂直堆叠图标
  if (collapsed) {
    return (
      <div className="mt-auto border-t border-border py-2 flex flex-col items-center gap-5">
        {/* 邀请图标 */}
        <ChatInviteCard collapsed={true} />

        {/* Upgrade 图标 */}
        <Link href="/pricing" className="shrink-0">
          <RocketIcon className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
        </Link>

        {/* 用户头像 + 下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer shrink-0">
              <UserAvatar user={user} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* 主题选项 */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("theme")}
            </DropdownMenuLabel>
            {themes.map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.value;
              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setTheme(item.value)}
                  className="cursor-pointer"
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="flex-1">{item.label}</span>
                  {isSelected && <CheckIcon className="w-5 h-5 text-primary" />}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* 语言选项 */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("language")}
            </DropdownMenuLabel>
            {languages.map((item) => {
              const isSelected = locale === item.value;
              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => handleLanguageChange(item.value)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{item.label}</span>
                  {isSelected && <CheckIcon className="w-5 h-5 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // 已登录 - 展开状态：完整UI
  return (
    <div className="mt-auto border-t border-border">
      {/* 邀请卡片 */}
      <ChatInviteCard collapsed={false} />

      {/* 用户信息行 */}
      <div className="flex items-center gap-2 px-3 pb-3">
        {/* 用户头像 */}
        <UserAvatar user={user} className="shrink-0" />

        {/* 用户名 */}
        <span className="text-sm font-medium flex-1 truncate">
          {user.nickname}
        </span>

        {/* Upgrade 按钮 */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs shrink-0"
        >
          <Link href="/pricing">{t("upgrade")}</Link>
        </Button>

        {/* 更多菜单 */}
        <ChatUserMenu />
      </div>
    </div>
  );
}
