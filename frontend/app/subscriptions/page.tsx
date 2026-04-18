import { Suspense } from "react";
import { SubscriptionsClient } from "@/components/pages/subscriptions-client";
import { SubscriptionsPageSkeleton } from "@/components/page-skeletons";

export default function SubscriptionSelectionPage() {
  return (
    <Suspense fallback={<SubscriptionsPageSkeleton />}>
      <SubscriptionsClient />
    </Suspense>
  );
}

