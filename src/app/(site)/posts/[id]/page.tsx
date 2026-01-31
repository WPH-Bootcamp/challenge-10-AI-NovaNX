import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { mockPosts } from "@/features/posts/data/mockPosts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return mockPosts.map((post) => ({ id: post.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = mockPosts.find((p) => p.id === id);

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const post = mockPosts.find((p) => p.id === id);

  if (!post) notFound();

  return (
    <main>
      <section className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 text-sm text-black/60">
              <Link href="/" className="hover:text-black">
                Home
              </Link>
              <span className="text-black/30">/</span>
              <span className="text-black/80">Post</span>
            </div>

            <header className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{post.category}</Badge>
                <p className="text-sm text-black/50">{post.publishedAt}</p>
              </div>

              <h1 className="mt-4 text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[44px]">
                {post.title}
              </h1>

              <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-black/65 sm:text-base">
                {post.excerpt}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-black/55">
                <span>
                  By{" "}
                  <span className="font-medium text-black/75">
                    {post.authorName}
                  </span>
                </span>
                <span className="text-black/20">•</span>
                <span>{post.readTimeMinutes} min read</span>
              </div>
            </header>

            <article className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
              <div className="space-y-4 text-[15px] leading-relaxed text-black/70 sm:text-base">
                <p>
                  Ini adalah halaman detail untuk kebutuhan slicing. Setelah UI
                  sudah match Figma, konten di sini bisa diganti dari API tanpa
                  mengubah layout.
                </p>
                <p>
                  Fokus utama: hierarchy typographic (judul, lead, body),
                  spacing antar section, dan state seperti loading / error /
                  not-found.
                </p>
                <p>
                  Nanti saat integrasi API, kamu tinggal mapping field API ke
                  komponen ini (misalnya title, content, author, createdAt,
                  category).
                </p>
              </div>

              <div className="mt-8 h-px w-full bg-black/5" />

              <div className="mt-6 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="rounded-xl bg-black/6 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/9"
                >
                  ← Back
                </Link>

                <Link
                  href="#top"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90"
                >
                  Back to top
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </main>
  );
}
