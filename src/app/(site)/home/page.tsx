import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { getMostLikedPosts, getRecommendedPosts } from "@/features/posts/api";
import { MostLikedSection } from "@/features/posts/components/MostLikedSection";
import { RecommendedFeed } from "@/features/posts/components/RecommendedFeed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const recommended = await getRecommendedPosts({ limit: 50, page: 1 }).catch(
    () => null,
  );

  const mostLiked = await getMostLikedPosts({ limit: 2, page: 1 }).catch(
    () => null,
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[home] most-liked ids/likes:",
      (mostLiked?.data ?? [])
        .slice(0, 2)
        .map((p) => ({ id: p.id, likes: p.likes })),
    );
  }

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black/90">
                Home
              </h1>
              <p className="mt-1 text-sm text-black/60">
                Example page untuk melihat detail blog.
              </p>
            </div>

            <Link
              href="/detail"
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90"
            >
              Open Detail
            </Link>
          </div>

          <RecommendedFeed posts={recommended?.data ?? []} />
          <div className="mt-8">
            <MostLikedSection posts={mostLiked?.data ?? []} />
          </div>
        </Container>
      </section>
    </main>
  );
}
