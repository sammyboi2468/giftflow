import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import RevisionForm from '@/components/revision-form/page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviseRequestPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    throw new Error('Request ID is missing');
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 bg-gray-50 text-sm font-medium text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading request details...
        </div>
      }
    >
      <RevisionForm requestId={id} />
    </Suspense>
  );
}