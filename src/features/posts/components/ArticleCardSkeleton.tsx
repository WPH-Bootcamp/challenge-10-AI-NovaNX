export function ArticleCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-black/5" />
        <div className="h-4 w-24 rounded bg-black/5" />
      </div>
      <div className="mt-4 h-5 w-4/5 rounded bg-black/5" />
      <div className="mt-2 h-5 w-3/5 rounded bg-black/5" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-black/5" />
        <div className="h-4 w-11/12 rounded bg-black/5" />
        <div className="h-4 w-9/12 rounded bg-black/5" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-black/5" />
        <div className="h-4 w-16 rounded bg-black/5" />
      </div>
      <div className="mt-6 h-px w-full bg-black/5" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-black/5" />
        <div className="h-4 w-6 rounded bg-black/5" />
      </div>
    </div>
  );
}
