"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  getPostById,
  getPostCommentsCount,
  searchPosts,
} from "@/features/posts/api";
import { resolveBackendUrl } from "@/features/users/api";
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["posts-search", debouncedQuery],
    queryFn: () => searchPosts({ query: debouncedQuery, limit: 10, page: 1 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const posts = useMemo(() => searchQuery.data?.data ?? [], [searchQuery.data]);

  const detailQueries = useQueries({
    queries: posts.map((post) => ({
      queryKey: ["post", post.id],
      queryFn: () => getPostById(post.id),
      enabled: debouncedQuery.length > 0,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    })),
  });

  const commentsCountQueries = useQueries({
    queries: posts.map((post) => ({
      queryKey: ["post-comments-count", post.id],
      queryFn: () => getPostCommentsCount(post.id),
      enabled: debouncedQuery.length > 0,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    })),
  });

  const detailsById = useMemo(() => {
    const map = new Map<number, Post>();
    for (let i = 0; i < posts.length; i++) {
      const id = posts[i]?.id;
      const detail = detailQueries[i]?.data;
      if (typeof id === "number" && detail) map.set(id, detail);
    }
    return map;
  }, [detailQueries, posts]);

  const commentsCountById = useMemo(() => {
    const map = new Map<number, number>();
    for (let i = 0; i < posts.length; i++) {
      const id = posts[i]?.id;
      const count = commentsCountQueries[i]?.data;
      if (typeof id === "number" && typeof count === "number")
        map.set(id, count);
    }
    return map;
  }, [commentsCountQueries, posts]);

  return (
    <main className="min-h-[calc(100dvh-64px)]">
      <section className="py-6 sm:py-8">
        <Container>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35">
              <Image
                src="/icons/searchicon.svg"
                alt="Search"
                width={18}
                height={18}
              />
            </span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-14 rounded-2xl pl-12 text-[15px]"
            />
          </div>

          {debouncedQuery.length > 0 ? (
            <div className="mt-6">
              {searchQuery.isLoading ? (
                <div className="space-y-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-black/5" />
                  <div className="h-4 w-full animate-pulse rounded bg-black/5" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-black/5" />
                </div>
              ) : null}

              {searchQuery.isError ? (
                <p className="text-sm text-black/60">Failed to load results.</p>
              ) : null}

              {!searchQuery.isLoading &&
              !searchQuery.isError &&
              !posts.length ? (
                <div className="flex min-h-[60dvh] flex-col items-center justify-center py-10 text-center">
                  <div className="relative h-44 w-44">
                    <Image
                      src="/Files-notfound.svg"
                      alt="No results"
                      fill
                      sizes="176px"
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-6 text-[16px] font-semibold text-black/90">
                    No results found
                  </div>
                  <div className="mt-2 text-[13px] text-black/55">
                    Try using different keywords
                  </div>

                  <Link
                    href="/home"
                    className="mt-7 inline-flex h-12 min-w-52 items-center justify-center rounded-full bg-sky-600 px-8 text-[14px] font-semibold text-white transition hover:bg-sky-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    Back to Home
                  </Link>
                </div>
              ) : null}

              {!searchQuery.isLoading && !searchQuery.isError && posts.length
                ? posts.map((post) => {
                    const detail = detailsById.get(post.id);
                    const likes = detail?.likes ?? post.likes ?? 0;
                    const comments =
                      commentsCountById.get(post.id) ??
                      detail?.comments ??
                      post.comments ??
                      0;

                    const authorName = post.author?.name ?? "User";
                    const avatarUrl = post.author?.avatarUrl
                      ? resolveBackendUrl(post.author.avatarUrl)
                      : "/icons/avatar-placeholder.svg";

                    return (
                      <article key={post.id} className="mt-6">
                        <h2 className="text-[20px] font-semibold leading-snug text-black">
                          <Link
                            href={`/posts/${post.id}`}
                            className="outline-none focus:ring-2 focus:ring-black/10"
                          >
                            {post.title}
                          </Link>
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(post.tags ?? []).slice(0, 8).map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>

                        <p className="mt-4 line-clamp-2 text-[14px] leading-relaxed text-black/70">
                          {stripHtmlToText(post.content)}
                        </p>

                        <div className="mt-5 flex items-center gap-2 text-[13px] text-black/55">
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
                            <Image
                              src={avatarUrl}
                              alt="Avatar"
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          </div>
                          <span className="font-medium text-black/70">
                            {authorName}
                          </span>
                          <span className="text-black/30">•</span>
                          <span>{formatDateUTC(post.createdAt)}</span>
                        </div>

                        <div className="mt-4 flex items-center gap-6 text-[13px] text-black/55">
                          <div className="flex items-center gap-2">
                            <Image
                              src="/icons/Like-Icon.svg"
                              alt="Like"
                              width={18}
                              height={18}
                            />
                            <span>{likes}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Image
                              src="/icons/Comment-Icon.svg"
                              alt="Comment"
                              width={18}
                              height={18}
                            />
                            <span>{comments}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                : null}
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}
