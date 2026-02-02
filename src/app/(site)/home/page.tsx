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
          <RecommendedFeed posts={recommended?.data ?? []} />
          <div className="mt-8">
            <MostLikedSection posts={mostLiked?.data ?? []} />
          </div>
        </Container>
      </section>
    </main>
  );
}
