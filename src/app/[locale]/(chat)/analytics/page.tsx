"use client";

import { useTranslations } from "next-intl";
import { SearchAutocomplete } from "@/components/chat/search-autocomplete";

export default function AnalyticsPage() {
  const t = useTranslations("analytics");

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* 搜索自动补全组件 */}
        <SearchAutocomplete />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">{t("card_market_title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("card_market_desc")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">{t("card_hot_title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("card_hot_desc")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">{t("card_analytics_title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("card_analytics_desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
