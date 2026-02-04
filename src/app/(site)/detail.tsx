import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { CommentCountIndicator } from "@/features/comments/components/CommentCountIndicator";
import { CommentComposer } from "@/features/comments/components/CommentComposer";
import { LikeButton } from "@/features/posts/components/LikeButton";
import type { Post } from "@/types/blog";

function formatDateUTC(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = months[date.getUTCMonth()] ?? "";
  const year = String(date.getUTCFullYear());

  return `${day} ${month} ${year}`;
}

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

type DetailProps = {
  post: Post;
};

export default function Detail({ post }: DetailProps) {
  const publishedAt = formatDateUTC(post.createdAt);
  const coverSrc = post.imageUrl || "/images/blog-cover-placeholder.svg";
  const authorName = post.author?.name ?? "Unknown";
  const content = post.content ?? "";

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <div className="flex items-center gap-3 text-sm text-black/60">
            <Link href="/home" className="hover:text-black">
              Home
            </Link>
            <span className="text-black/30">/</span>
            <span className="text-black/80">Detail</span>
          </div>

          <article className="mt-6 overflow-hidden bg-white">
            <div className="p-6 sm:p-8">
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-black/90 sm:text-[56px]">
                {post.title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5">
                  <Image
                    src="/icons/MyAvatar.png"
                    alt="Author avatar"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-black/60">
                  <span className="font-medium text-black/80">
                    {authorName}
                  </span>
                  <span className="text-black/20">•</span>
                  <time dateTime={post.createdAt}>{publishedAt}</time>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[#D5D7DA]" />

            <div className="flex items-center gap-8 px-6 py-4 text-black/60 sm:px-8">
              <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />

              <CommentCountIndicator
                postId={post.id}
                initialCount={post.comments ?? 0}
              />
            </div>

            <div className="h-px w-full bg-[#D5D7DA]" />

            <div className="relative aspect-16/7 w-full bg-black/5">
              <Image
                src={coverSrc}
                alt="Cover image"
                fill
                priority
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover"
              />
            </div>

            <div className="p-6 sm:p-8">
              {looksLikeHtml(content) ? (
                <div
                  className="text-[15px] leading-relaxed text-black/70 sm:text-base [&_p]:mt-4 [&_p:first-child]:mt-0 [&_a]:text-sky-700 [&_a]:underline-offset-2 hover:[&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className="text-[15px] leading-relaxed text-black/70 sm:text-base">
                  {content}
                </div>
              )}
            </div>
          </article>

          <CommentComposer postId={post.id} initialCount={post.comments ?? 0} />
        </Container>
      </section>
    </main>
  );
}
