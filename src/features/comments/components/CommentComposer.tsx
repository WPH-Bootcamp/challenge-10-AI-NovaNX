"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/features/auth/useAuthToken";
import { clearAuthToken } from "@/features/auth/token";
import { getMyProfile, resolveBackendUrl } from "@/features/users/api";
import { AnotherPost } from "@/features/posts/components/AnotherPost";
import {
  addCommentToPost,
  getCommentsByPostId,
  type Comment,
} from "@/features/comments/api";
import { emitCommentsCountChanged } from "@/features/comments/events";
import { ApiError } from "@/lib/api";

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
  postId: number;
  initialCount?: number;
};

export function CommentComposer({ postId, initialCount = 0 }: Props) {
  const token = useAuthToken();
  const [myName, setMyName] = useState<string>("John Doe");
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  const [count, setCount] = useState<number>(initialCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCommentsByPostId(postId)
      .then((comments) => {
        if (cancelled) return;
        setComments(comments);
        setCount(comments.length);
        emitCommentsCountChanged({ postId, count: comments.length });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    getMyProfile(token)
      .then((profile) => {
        if (cancelled) return;
        setMyName(profile.name ?? "John Doe");
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

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsModalOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen]);

  const canSend = useMemo(() => {
    return content.trim().length > 0 && !isSending;
  }, [content, isSending]);

  async function onSend() {
    if (!token) {
      setError("Kamu harus login dulu untuk komentar.");
      return;
    }

    const message = content.trim();
    if (!message) return;

    setIsSending(true);
    setError(null);
    try {
      const created = await addCommentToPost(postId, message, token);
      setContent("");
      setComments((prev) => [created, ...prev]);
      setCount((c) => {
        const next = c + 1;
        emitCommentsCountChanged({ postId, count: next });
        return next;
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthToken();
          setError("Sesi kamu habis. Silakan login lagi.");
          return;
        }
        setError(err.message);
      } else {
        setError("Gagal mengirim komentar.");
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mt-8 border-t border-[#D5D7DA] pt-6">
      <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-black/90">
        Comments({count})
      </h2>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full border border-black/10 bg-black/5">
          <Image
            src={myAvatarUrl ?? "/icons/avatar-placeholder.svg"}
            alt="Avatar"
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>
        <div className="text-[16px] font-semibold text-black/80">{myName}</div>
      </div>

      <div className="mt-6">
        <h3 className="text-[20px] font-semibold text-black/85">
          Give your Comments
        </h3>

        <div className="mt-3">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your comment"
            rows={6}
            className="w-full resize-none rounded-2xl border border-black/15 px-4 py-4 text-[16px] text-black/80 outline-none placeholder:text-black/40 focus:ring-2 focus:ring-sky-200"
          />
        </div>

        {!token ? (
          <p className="mt-3 text-sm text-black/55">
            Kamu belum login.{" "}
            <Link
              href="/login"
              className="font-medium text-sky-700 hover:underline"
            >
              Login
            </Link>
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-full bg-sky-600 text-[16px] font-semibold text-white transition hover:bg-sky-600/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send"}
        </button>

        <div className="mt-7 border-t border-[#D5D7DA]">
          {comments.slice(0, 3).map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 border-b border-[#D5D7DA] py-6"
            >
              <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black/5">
                <Image
                  src={
                    comment.author?.avatarUrl
                      ? resolveBackendUrl(comment.author.avatarUrl)
                      : "/icons/avatar-placeholder.svg"
                  }
                  alt="User avatar"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-black/85">
                  {comment.author?.name ?? "User"}
                </div>
                <div className="mt-0.5 text-[14px] text-black/45">
                  {formatDateId(comment.createdAt)}
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-black/70">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {comments.length > 3 ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-sm font-semibold text-sky-700 hover:underline"
            >
              See All Comments
            </button>
          ) : null}

          <AnotherPost currentPostId={postId} />
        </div>
      </div>

      <div className="mt-8 border-b border-[#D5D7DA]" />

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="All comments"
        >
          <div className="flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#D5D7DA] px-5 py-4">
              <div className="text-[18px] font-semibold text-black/90">
                Comments({count})
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/5"
                aria-label="Close"
              >
                <span className="text-[20px] leading-none">×</span>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
              <h3 className="text-[16px] font-semibold text-black/85">
                Give your Comments
              </h3>

              <div className="mt-3">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your comment"
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-black/15 px-4 py-4 text-[16px] text-black/80 outline-none placeholder:text-black/40 focus:ring-2 focus:ring-sky-200"
                />
              </div>

              {!token ? (
                <p className="mt-3 text-sm text-black/55">
                  Kamu belum login.{" "}
                  <Link
                    href="/login"
                    className="font-medium text-sky-700 hover:underline"
                  >
                    Login
                  </Link>
                </p>
              ) : null}

              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}

              <button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-full bg-sky-600 text-[16px] font-semibold text-white transition hover:bg-sky-600/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>

              <div className="mt-5 min-h-0 flex-1 overflow-auto border-t border-[#D5D7DA]">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-4 border-b border-[#D5D7DA] py-6"
                  >
                    <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black/5">
                      <Image
                        src={
                          comment.author?.avatarUrl
                            ? resolveBackendUrl(comment.author.avatarUrl)
                            : "/icons/avatar-placeholder.svg"
                        }
                        alt="User avatar"
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold text-black/85">
                        {comment.author?.name ?? "User"}
                      </div>
                      <div className="mt-0.5 text-[14px] text-black/45">
                        {formatDateId(comment.createdAt)}
                      </div>
                      <p className="mt-3 text-[15px] leading-relaxed text-black/70">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
