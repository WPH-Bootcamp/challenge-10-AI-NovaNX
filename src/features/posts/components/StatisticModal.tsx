"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getLikesByPost, getPostCommentsForStats } from "@/features/posts/api";
import { resolveBackendUrl } from "@/features/users/api";
import type { UserSummary } from "@/types/blog";

type TabKey = "likes" | "comments";

type CommentForStats = {
  id: number;
  content: string;
  createdAt: string;
  author: UserSummary;
};

function formatDateId(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function UserRow({ user }: { user: UserSummary }) {
  const avatarUrl = user.avatarUrl ? resolveBackendUrl(user.avatarUrl) : null;
  const headline = user.headline ?? "Frontend Developer";

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-black/5">
        <Image
          src={avatarUrl ?? "/icons/avatar-placeholder.svg"}
          alt={user.name}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold text-black/85">
          {user.name}
        </div>
        <div className="text-[11px] text-black/45">{headline}</div>
      </div>
    </div>
  );
}

function CommentRow({ comment }: { comment: CommentForStats }) {
  const user = comment.author;
  const avatarUrl = user.avatarUrl ? resolveBackendUrl(user.avatarUrl) : null;
  const dateLabel = formatDateId(comment.createdAt);

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <div className="relative mt-[2px] h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black/5">
          <Image
            src={avatarUrl ?? "/icons/avatar-placeholder.svg"}
            alt={user.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-black/85">
            {user.name}
          </div>
          {dateLabel ? (
            <div className="mt-0.5 text-[11px] text-black/45">{dateLabel}</div>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-black/60 whitespace-pre-wrap">
        {comment.content}
      </p>
    </div>
  );
}

export function StatisticModal({
  isOpen,
  onClose,
  postId,
  likesCount,
  commentsCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  likesCount?: number;
  commentsCount?: number;
}) {
  const [tab, setTab] = useState<TabKey>("likes");

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const likesQuery = useQuery({
    queryKey: ["post-likes", postId],
    queryFn: () => getLikesByPost(postId),
    enabled: isOpen,
    staleTime: 0,
  });

  const commentsQuery = useQuery({
    queryKey: ["post-comments-stats", postId],
    queryFn: () =>
      getPostCommentsForStats(postId) as Promise<CommentForStats[]>,
    enabled: isOpen,
    staleTime: 0,
  });

  const comments = commentsQuery.data ?? [];

  const likesUsers = likesQuery.data ?? [];

  const likesLabelCount = Math.max(
    likesUsers.length,
    typeof likesCount === "number" ? likesCount : 0,
  );

  const commentsLabelCount = Math.max(
    comments.length,
    typeof commentsCount === "number" ? commentsCount : 0,
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Statistic"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[14px] font-semibold text-black/90">Statistic</h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black/70"
            onClick={onClose}
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
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 border-b border-black/10 px-5">
          <div className="flex items-center gap-8">
            <button
              type="button"
              className={
                "relative -mb-px flex items-center gap-2 px-1 py-3 text-[12px] font-semibold " +
                (tab === "likes" ? "text-sky-700" : "text-black/45")
              }
              onClick={() => setTab("likes")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M14 9V5a3 3 0 0 0-3-3l-1 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 22h10a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              Like
              {tab === "likes" ? (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
              ) : null}
            </button>

            <button
              type="button"
              className={
                "relative -mb-px flex items-center gap-2 px-1 py-3 text-[12px] font-semibold " +
                (tab === "comments" ? "text-sky-700" : "text-black/45")
              }
              onClick={() => setTab("comments")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              Comment
              {tab === "comments" ? (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
              ) : null}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          {tab === "likes" ? (
            <>
              <div className="text-[13px] font-semibold text-black/80">
                Like({likesLabelCount})
              </div>

              <div className="mt-3 max-h-[360px] overflow-auto">
                {likesQuery.isLoading ? (
                  <p className="py-3 text-sm text-black/50">Loading…</p>
                ) : null}

                {likesQuery.isError ? (
                  <p className="py-3 text-sm text-rose-600">
                    Gagal memuat likes.
                  </p>
                ) : null}

                {!likesQuery.isLoading &&
                !likesQuery.isError &&
                !likesUsers.length ? (
                  <p className="py-3 text-sm text-black/50">
                    Belum ada yang like.
                  </p>
                ) : null}

                {!likesQuery.isLoading && !likesQuery.isError
                  ? likesUsers.map((u, idx) => (
                      <div
                        key={u.id}
                        className={
                          idx === likesUsers.length - 1
                            ? ""
                            : "border-b border-black/10"
                        }
                      >
                        <UserRow user={u} />
                      </div>
                    ))
                  : null}
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-black/80">
                Comment({commentsLabelCount})
              </div>

              <div className="mt-3 max-h-[360px] overflow-auto">
                {commentsQuery.isLoading ? (
                  <p className="py-3 text-sm text-black/50">Loading…</p>
                ) : null}

                {commentsQuery.isError ? (
                  <p className="py-3 text-sm text-rose-600">
                    Gagal memuat comments.
                  </p>
                ) : null}

                {!commentsQuery.isLoading &&
                !commentsQuery.isError &&
                !comments.length ? (
                  <p className="py-3 text-sm text-black/50">
                    Belum ada yang comment.
                  </p>
                ) : null}

                {!commentsQuery.isLoading && !commentsQuery.isError
                  ? comments.map((c, idx) => (
                      <div
                        key={c.id}
                        className={
                          idx === comments.length - 1
                            ? ""
                            : "border-b border-black/10"
                        }
                      >
                        <CommentRow comment={c} />
                      </div>
                    ))
                  : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
