"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge";
import { clearAuthToken } from "@/features/auth/token";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { getMyPosts } from "@/features/posts/api";
import { resolveBackendUrl } from "@/features/users/api";
import { ApiError } from "@/lib/api";

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

function formatDateId(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type Props = {
  currentPostId: number;
};

export function AnotherPost({ currentPostId }: Props) {
  const token = useAuthToken();
  const [seed] = useState(() => Math.random());

  const myPostsQuery = useQuery({
    queryKey: ["my-posts", token],
    queryFn: async () => {
      if (!token) throw new ApiError("Unauthorized", 401);

      // Random each page visit: pick a random post from a stable page.
      // The previous random-page approach could frequently return an empty page
      // (e.g. lastPage=1), causing the section to never render.
      return getMyPosts({ limit: 50, page: 1 }, token);
    },
    enabled: Boolean(token),
    staleTime: 0,
    retry: 1,
  });

  const candidates = useMemo(() => {
    const rows = myPostsQuery.data?.data ?? [];
    return rows.filter((p) => p.id !== currentPostId);
  }, [currentPostId, myPostsQuery.data]);

  const post = useMemo(() => {
    if (!candidates.length) return null;
    const idx = Math.floor(seed * candidates.length);
    return candidates[idx] ?? candidates[0] ?? null;
  }, [candidates, seed]);

  const status: "loading" | "ready" | "empty" | "no-token" | "error" = !token
    ? "no-token"
    : myPostsQuery.isLoading
      ? "loading"
      : myPostsQuery.isError
        ? "error"
        : post
          ? "ready"
          : "empty";

  useEffect(() => {
    const err = myPostsQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      clearAuthToken();
    }
  }, [myPostsQuery.error]);

  const excerpt = useMemo(() => {
    if (!post) return "";
    return stripHtmlToText(post.content).slice(0, 140);
  }, [post]);

  const authorName = post?.author?.name ?? "Unknown";
  const authorAvatar = post?.author?.avatarUrl
    ? resolveBackendUrl(post.author.avatarUrl)
    : null;

  return (
    <section className="mt-6 border-t border-[#D5D7DA] pt-6">
      <h3 className="text-[28px] font-semibold tracking-[-0.02em] text-black/90">
        Another Post
      </h3>

      {status === "no-token" ? (
        <p className="mt-4 text-[15px] leading-relaxed text-black/60">
          Please log in to view{" "}
          <span className="font-medium">more posts</span>.
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="mt-4 text-[15px] leading-relaxed text-black/60">
          Loading…
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-4 text-[15px] leading-relaxed text-black/60">
          Gagal memuat <span className="font-medium">Another Post</span>.
        </p>
      ) : null}

      {status === "empty" ? (
        <p className="mt-4 text-[15px] leading-relaxed text-black/60">
          Belum ada post lain untuk ditampilkan.
        </p>
      ) : null}

      {post ? (
        <article className="mt-5">
          <Link href={`/posts/${post.id}`} className="block">
            <h4 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-black/90">
              {post.title}
            </h4>

            <div className="mt-5 flex flex-wrap gap-2">
              {(post.tags ?? []).slice(0, 6).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>

            <p className="mt-4 line-clamp-2 text-[15px] leading-relaxed text-black/70">
              {excerpt}
            </p>

            <div className="mt-5 flex items-center gap-3 text-sm text-black/60">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5">
                <Image
                  src={authorAvatar ?? "/icons/avatar-placeholder.svg"}
                  alt="Author avatar"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-black/80">{authorName}</span>
                <span className="text-black/20">•</span>
                <span>{formatDateId(post.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-8 text-sm text-black/60">
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
          </Link>
        </article>
      ) : null}
    </section>
  );
}
