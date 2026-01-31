import { Container } from "@/components/layout/Container";
import { getRecommendedPosts } from "@/features/posts/api";
import { RecommendedFeed } from "@/features/posts/components/RecommendedFeed";

export default async function HomePage() {
  const recommended = await getRecommendedPosts({ limit: 10, page: 1 }).catch(
    () => null,
  );

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <RecommendedFeed posts={recommended?.data ?? []} />
        </Container>
      </section>
    </main>
  );
}
