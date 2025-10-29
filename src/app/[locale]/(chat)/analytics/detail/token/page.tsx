import { Suspense } from "react";
import { EntityDetailContent } from "@/components/chat/entity-detail-content";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * 骨架屏组件
 */
function DetailPageSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-3 min-w-0">
            <div className="h-7 bg-muted rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Token详情内容组件
 */
async function TokenDetailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Token Not Found
          </h1>
          <p className="text-muted-foreground">
            Please provide a valid token parameter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <EntityDetailContent entity={token} type="TOKEN" />
    </div>
  );
}

/**
 * Token详情页面
 * URL: /detail/token?token=xxx
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <TokenDetailPage searchParams={searchParams} />
    </Suspense>
  );
}
