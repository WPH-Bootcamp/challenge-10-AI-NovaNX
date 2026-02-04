import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/types/blog";

export function MostLikedSection({ posts }: { posts: Post[] }) {
  const mostLiked = [...posts]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 3);

  if (!mostLiked.length) return null;

  return (
    <section className="mx-auto w-full max-w-107.5 px-4">
      <h2 className="text-[18px] font-semibold text-black">Most liked</h2>

      <div className="mt-4 border-t border-[#D5D7DA]">
        {mostLiked.map((post) => (
          <article
            key={`most-liked-${post.id}`}
            className="border-b border-[#D5D7DA] py-5"
          >
            <h3 className="text-[18px] font-semibold leading-snug text-black">
              <Link
                href={`/posts/${post.id}`}
                className="outline-none focus:ring-2 focus:ring-black/10"
              >
                {post.title}
              </Link>
            </h3>

            <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-black/65">
              {post.content}
            </p>

            <div className="mt-4 flex items-center gap-6 text-[14px] text-black/55">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/Like-Icon.svg"
                  alt="Like"
                  width={20}
                  height={20}
                />
                <span>{post.likes ?? 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <Image
                  src="/icons/Comment-Icon.svg"
                  alt="Comment"
                  width={20}
                  height={20}
                />
                <span>{post.comments ?? 0}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
