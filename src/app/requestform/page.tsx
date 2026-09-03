import { Suspense } from "react";
import FormContent from "@/components/request-form/page";
import { Loader2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ draftId?: string; requestId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeId = resolvedParams.draftId || resolvedParams.requestId;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 bg-gray-50 text-sm font-medium text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading request form...
        </div>
      }
    >
      <FormContent initialDraftId={activeId} />
    </Suspense>
  );
}