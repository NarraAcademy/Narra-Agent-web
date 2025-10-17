"use client";

import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DotsVerticalIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
  CheckIcon,
  ExitIcon,
} from "@radix-ui/react-icons";

export function ChatUserMenu() {
  const t = useTranslations("chat.user_menu");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <DotsVerticalIcon className="w-4 h-4" />
        </Button>
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
              <Icon className="w-4 h-4 mr-2" />
              <span className="flex-1">{item.label}</span>
              {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
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
              {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* 退出登录 */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <ExitIcon className="w-4 h-4 mr-2" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
