import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

// Loading-state twin of HobbyPage: same header/toolbar/table footprint so the
// real content lands without a layout jump. Shared by the four hobby routes'
// loading.tsx files.
export function HobbyPageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="h-8 w-64 max-w-full rounded-lg skeleton" />
        <div className="h-7 w-24 rounded-md skeleton" />
        <div className="h-7 w-36 rounded-md skeleton" />
        <div className="h-8 w-full rounded-lg skeleton sm:ml-auto sm:w-20" />
      </div>
      <Card padding="none" className="hidden overflow-hidden lg:block">
        <div className="h-9 bg-white/[0.03]" />
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="flex items-center gap-3 border-t border-border px-3 py-2">
            <div className="h-[60px] w-10 shrink-0 rounded skeleton" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
            </div>
            <div className="h-4 w-10 shrink-0 rounded skeleton" />
            <div className="h-5 w-24 shrink-0 rounded-md skeleton" />
            <div className="h-8 w-16 shrink-0 rounded skeleton" />
          </div>
        ))}
      </Card>
      <div className="space-y-2 lg:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <Card key={i} padding="sm" className="flex gap-3">
            <div className="h-[84px] w-14 shrink-0 rounded skeleton" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="h-4 w-40 max-w-full rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
              <div className="h-5 w-20 rounded-md skeleton" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
