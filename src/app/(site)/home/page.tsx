import { Container } from "@/components/layout/Container";
import {
  getMostLikedPosts,
  getPostCommentsCount,
  getPostById,
  getRecommendedPosts,
} from "@/features/posts/api";
import { MostLikedSection } from "@/features/posts/components/MostLikedSection";
import { RecommendedFeed } from "@/features/posts/components/RecommendedFeed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const recommended = await getRecommendedPosts({ limit: 50, page: 1 }).catch(
    () => null,
  );

  const mostLiked = await getMostLikedPosts({ limit: 20, page: 1 }).catch(
    () => null,
  );

  const mostLikedAccurate = (
    await Promise.all(
      (mostLiked?.data ?? []).map(async (post) => {
        const fresh = await getPostById(post.id).catch(() => null);
        if (!fresh) return post;
        return { ...post, likes: fresh.likes, comments: fresh.comments };
      }),
    )
  ).sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

  const topMostLiked = mostLikedAccurate.slice(0, 3);
  const topMostLikedWithAccurateComments = await Promise.all(
    topMostLiked.map(async (post) => {
      const count = await getPostCommentsCount(post.id).catch(
        () => post.comments,
      );
      return {
        ...post,
        comments: typeof count === "number" ? count : post.comments,
      };
    }),
  );

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <RecommendedFeed posts={recommended?.data ?? []} />
          <div className="mt-8">
            <MostLikedSection posts={topMostLikedWithAccurateComments} />
          </div>
        </Container>
      </section>
    </main>
  );
}
