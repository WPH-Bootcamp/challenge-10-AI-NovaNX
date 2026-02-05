import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/types/blog";

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function stripHtmlToText(input: string) {
  if (!input) return "";
  if (!looksLikeHtml(input)) return input;

  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function MostLikedSection({ posts }: { posts: Post[] }) {
  const mostLiked = [...posts]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 3);

  if (!mostLiked.length) return null;

  return (
    <section>
      <h2 className="text-[18px] font-semibold text-black">Most Liked</h2>

      <div className="mt-4 border-t border-[#D5D7DA]">
        {mostLiked.map((post) => (
          <article
            key={`most-liked-${post.id}`}
            className="border-b border-[#D5D7DA] py-5"
          >
            <h3 className="text-[16px] font-semibold leading-snug text-black md:text-[14px]">
              <Link
                href={`/posts/${post.id}`}
                className="outline-none focus:ring-2 focus:ring-black/10"
              >
                {post.title}
              </Link>
            </h3>

            <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-black/65 md:text-[12px]">
              {stripHtmlToText(post.content)}
            </p>

            <div className="mt-4 flex items-center gap-6 text-[14px] text-black/55 md:text-[12px]">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/Like-Icon.svg"
                  alt="Like"
                  width={18}
                  height={18}
                />
                <span>{post.likes ?? 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <Image
                  src="/icons/Comment-Icon.svg"
                  alt="Comment"
                  width={18}
                  height={18}
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
