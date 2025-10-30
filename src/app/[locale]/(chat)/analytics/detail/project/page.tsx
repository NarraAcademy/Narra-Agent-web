import { Suspense } from "react";
import { EntityDetailContent } from "@/components/chat/entity-detail-content";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ entity?: string }>;
}

/**
 * 骨架屏组件
 */
function DetailPageSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
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
    </div>
  );
}

/**
 * 项目详情内容组件
 */
async function ProjectDetailPage({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const params = await searchParams;
  const entity = params.entity;

  if (!entity) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Project Not Found
            </h1>
            <p className="text-muted-foreground">
              Please provide a valid entity parameter
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <EntityDetailContent entity={entity} type="PROJECT" showToc={true} />
      </div>
    </div>
  );
}

/**
 * 项目详情页面
 * URL: /detail/project?entity=xxx
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <ProjectDetailPage searchParams={searchParams} />
    </Suspense>
  );
}
