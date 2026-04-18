"use client";

import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonCard, SkeletonProgressRow, SkeletonText } from "@/components/ui/skeleton";

export function SubscriptionsPageSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass p-4">
            <div className="flex gap-3">
              <Skeleton className="size-12 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <SkeletonText className="w-full" />
              </div>
            </div>
            <div className="mt-3 space-y-2 rounded-2xl border border-white/5 bg-black/10 p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SoloPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-full max-w-[280px]" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <Card className="glass p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-9 w-28" />
          </div>
          <div className="text-right">
            <Skeleton className="ml-auto h-3 w-20" />
            <Skeleton className="mt-2 ml-auto h-9 w-16" />
          </div>
        </div>
        <div className="mt-4">
          <SkeletonProgressRow />
        </div>
      </Card>
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-2 px-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full max-w-[280px]" />
      </div>
      <Card className="glass p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-48 max-w-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-[220px]" />
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-4 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="glass flex min-h-[240px] flex-col items-center justify-center py-10 lg:col-span-5">
          <Skeleton className="size-44 rounded-full" />
          <Skeleton className="mt-4 h-3 w-40" />
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass p-4 sm:p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-24" />
            </Card>
          ))}
        </div>
      </div>
      <Card className="glass p-5 sm:p-6">
        <div className="flex justify-between border-b border-white/10 pb-4">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-6 w-36" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-black/10 p-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
      <Card className="glass p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-full rounded-xl" />
      </Card>
    </div>
  );
}
