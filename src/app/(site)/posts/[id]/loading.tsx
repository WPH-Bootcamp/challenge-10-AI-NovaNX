import { Container } from "@/components/layout/Container";
import { ArticleCardSkeleton } from "@/features/posts/components/ArticleCardSkeleton";

export default function Loading() {
  return (
    <main>
      <section className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="h-5 w-40 animate-pulse rounded bg-black/5" />

            <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
              <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
              <div className="mt-4 h-10 w-4/5 animate-pulse rounded bg-black/5" />
              <div className="mt-3 h-5 w-3/5 animate-pulse rounded bg-black/5" />
              <div className="mt-6 h-5 w-52 animate-pulse rounded bg-black/5" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
