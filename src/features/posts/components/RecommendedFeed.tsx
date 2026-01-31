"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Post } from "@/types/blog";

const FILTER_TAGS = ["Programming", "Frontend", "Coding"] as const;

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

export function RecommendedFeed({ posts }: { posts: Post[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts;
    const wanted = activeTag.toLowerCase();

    return posts.filter((post) =>
      (post.tags ?? []).some((tag) => tag.toLowerCase() === wanted),
    );
  }, [activeTag, posts]);

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <h1 className="text-[18px] font-semibold text-black">
        Recommend For You
      </h1>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTER_TAGS.map((label) => {
          const isActive = activeTag === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTag(isActive ? null : label)}
              className={
                "rounded-full border px-3 py-1 text-[12px] font-medium transition " +
                (isActive
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black/70 hover:border-black/20")
              }
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
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
                {post.content}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[12px] text-black/55">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-black/60">
                    {getInitials(post.author?.name ?? "User")}
                  </div>
                </div>
                <span className="font-medium text-black/70">
                  {post.author?.name ?? "Unknown"}
                </span>
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
                  <span>{post.likes ?? 0}</span>
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
                  <span>{post.comments ?? 0}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
            Tidak ada post untuk filter ini.
          </div>
        )}
      </div>
    </div>
  );
}
