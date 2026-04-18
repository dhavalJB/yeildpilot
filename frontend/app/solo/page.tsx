import { Suspense } from "react";
import { SoloClient } from "@/components/pages/solo-client";
import { SoloPageSkeleton } from "@/components/page-skeletons";

export default function SoloFlowPage() {
  return (
    <Suspense fallback={<SoloPageSkeleton />}>
      <SoloClient />
    </Suspense>
  );
}

