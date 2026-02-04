"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import type { Post } from "@/types/blog";
import { clearAuthToken } from "@/features/auth/token";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { getMyProfile, resolveBackendUrl } from "@/features/users/api";
import { getPostById, getPostCommentsCount } from "@/features/posts/api";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 5;

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function stripHtmlToText(input: string) {
  if (!input) return "";
  if (!looksLikeHtml(input)) return input;

  // Keep it SSR-safe (client components can still render on the server).
  // This is a lightweight preview; the Detail page renders full HTML.
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

function getPaginationItems(page: number, totalPages: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Show only a 3-page window. Remaining pages are represented with ellipsis.
  // Example (many pages): 1 2 3 …, then … 2 3 4 …, then … 3 4 5 …, etc.
  const start = Math.min(Math.max(1, page - 1), totalPages - 2);
  const end = start + 2;

  const items: Array<number | "…"> = [];
  if (start > 1) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages) items.push("…");
  return items;
}

export function RecommendedFeed({ posts }: { posts: Post[] }) {
  const token = useAuthToken();
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setMyAvatarUrl(null);
        setMyUserId(null);
      });
      return;
    }

    let cancelled = false;

    getMyProfile(token)
      .then((profile) => {
        if (cancelled) return;
        setMyUserId(profile.id);
        setMyAvatarUrl(
          profile.avatarUrl ? resolveBackendUrl(profile.avatarUrl) : null,
        );
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredPosts = posts;

  const detailQueries = useQueries({
    queries: filteredPosts.map((post) => ({
      queryKey: ["post", post.id],
      queryFn: () => getPostById(post.id),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    })),
  });

  const commentsCountQueries = useQueries({
    queries: filteredPosts.map((post) => ({
      queryKey: ["post-comments-count", post.id],
      queryFn: () => getPostCommentsCount(post.id),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    })),
  });

  const detailsById = useMemo(() => {
    const map = new Map<number, Post>();
    for (let i = 0; i < filteredPosts.length; i++) {
      const postId = filteredPosts[i]?.id;
      const detail = detailQueries[i]?.data;
      if (typeof postId === "number" && detail) {
        map.set(postId, detail);
      }
    }
    return map;
  }, [detailQueries, filteredPosts]);

  const commentsCountById = useMemo(() => {
    const map = new Map<number, number>();
    for (let i = 0; i < filteredPosts.length; i++) {
      const postId = filteredPosts[i]?.id;
      const count = commentsCountQueries[i]?.data;
      if (typeof postId === "number" && typeof count === "number") {
        map.set(postId, count);
      }
    }
    return map;
  }, [commentsCountQueries, filteredPosts]);

  const orderedPosts = useMemo(() => {
    const ordered = [...filteredPosts];

    ordered.sort((a, b) => {
      const aMine = typeof myUserId === "number" && a.author?.id === myUserId;
      const bMine = typeof myUserId === "number" && b.author?.id === myUserId;

      if (aMine !== bMine) return aMine ? -1 : 1;

      if (!aMine && !bMine) {
        const aDetail = detailsById.get(a.id);
        const bDetail = detailsById.get(b.id);

        const aComments =
          commentsCountById.get(a.id) ?? aDetail?.comments ?? a.comments ?? 0;
        const bComments =
          commentsCountById.get(b.id) ?? bDetail?.comments ?? b.comments ?? 0;

        const aScore = (aDetail?.likes ?? a.likes ?? 0) + aComments;
        const bScore = (bDetail?.likes ?? b.likes ?? 0) + bComments;

        if (bScore !== aScore) return bScore - aScore;
      }

      return 0;
    });

    return ordered;
  }, [commentsCountById, detailsById, filteredPosts, myUserId]);

  const totalPages = Math.max(1, Math.ceil(orderedPosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedPosts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return orderedPosts.slice(start, start + PAGE_SIZE);
  }, [orderedPosts, safePage]);

  function RecommendedPostItem({
    post,
    isLastItem,
    likes,
    comments,
    isMyPost,
  }: {
    post: Post;
    isLastItem: boolean;
    likes: number;
    comments: number;
    isMyPost: boolean;
  }) {
    const authorName = post.author?.name ?? "Unknown";
    const showAvatarImage = isMyPost;

    return (
      <article
        className={(isLastItem ? "" : "border-b border-[#D5D7DA] ") + "py-5"}
      >
        <h2 className="text-[16px] font-semibold leading-snug text-black">
          <Link
            href={`/posts/${post.id}`}
            className="outline-none focus:ring-2 focus:ring-black/10"
          >
            {post.title}
          </Link>
        </h2>

        <div className="mt-2 flex flex-wrap gap-2">
          {(post.tags ?? []).slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-black/60"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-black/65">
          {stripHtmlToText(post.content)}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-black/55">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
            {showAvatarImage ? (
              <Image
                src={myAvatarUrl ?? "/icons/avatar-placeholder.svg"}
                alt="Avatar"
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-black/60">
                {getInitials(post.author?.name ?? "User")}
              </div>
            )}
          </div>
          <span className="font-medium text-black/70">{authorName}</span>
          <span className="text-black/30">•</span>
          <span>{formatDateUTC(post.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center gap-6 text-[12px] text-black/55">
          <div className="flex items-center gap-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-black/55"
            >
              <path
                d="M9 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h5v11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 11 12.5 3.5A2 2 0 0 1 14.3 2h.2a2 2 0 0 1 2 2.3L15.8 11H20a2 2 0 0 1 2 2.4l-1 6A2 2 0 0 1 19 22H9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span>{likes}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-black/55"
            >
              <path
                d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span>{comments}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto w-full max-w-107.5 px-4">
      <h1 className="text-[18px] font-semibold text-black">
        Recommend For You
      </h1>

      <div className="mt-4">
        {paginatedPosts.length ? (
          paginatedPosts.map((post, idx) => {
            const isLastItem = idx === paginatedPosts.length - 1;
            const isMyPost =
              typeof myUserId === "number" && post.author?.id === myUserId;

            const detail = detailsById.get(post.id);
            const likes = detail?.likes ?? post.likes ?? 0;
            const comments =
              commentsCountById.get(post.id) ??
              detail?.comments ??
              post.comments ??
              0;

            return (
              <RecommendedPostItem
                key={post.id}
                post={post}
                isLastItem={isLastItem}
                likes={likes}
                comments={comments}
                isMyPost={isMyPost}
              />
            );
          })
        ) : (
          <div className="border-b border-[#D5D7DA] py-5 text-sm text-black/60">
            Tidak ada post untuk filter ini.
          </div>
        )}
      </div>

      {orderedPosts.length > PAGE_SIZE ? (
        <div className="mt-6 border-t border-[#D5D7DA] border-b-[6px] border-b-[#D5D7DA] py-4">
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-2 text-sm font-medium text-black/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2">
              {getPaginationItems(safePage, totalPages).map((item, idx) => {
                if (item === "…") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-sm text-black/40"
                    >
                      …
                    </span>
                  );
                }

                const isCurrent = item === safePage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition " +
                      (isCurrent
                        ? "bg-sky-600 text-white"
                        : "text-black/60 hover:bg-black/5 hover:text-black/80")
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-2 text-sm font-medium text-black/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
