"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useAuthToken } from "@/features/auth/useAuthToken";
import { clearAuthToken } from "@/features/auth/token";
import { getLikesByPost, toggleLikePost } from "@/features/posts/api";
import { getMyProfile } from "@/features/users/api";
import { ApiError } from "@/lib/api";

type Props = {
  postId: number;
  initialLikes: number;
};

export function LikeButton({ postId, initialLikes }: Props) {
  const token = useAuthToken();
  const [likes, setLikes] = useState<number>(initialLikes ?? 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLiked(false);
      return;
    }

    let cancelled = false;

    Promise.all([getMyProfile(token), getLikesByPost(postId)])
      .then(([me, likedUsers]) => {
        if (cancelled) return;
        setIsLiked(likedUsers.some((u) => u.id === me.id));
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
  }, [postId, token, initialLikes]);

  async function onToggleLike() {
    if (!token) {
      setError("Kamu harus login dulu untuk like.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedPost = await toggleLikePost(postId, token);

      setLikes((prevLikes) => {
        if (typeof updatedPost.likes === "number") return updatedPost.likes;
        return isLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;
      });

      setIsLiked((v) => !v);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthToken();
        setError("Sesi kamu habis. Silakan login lagi.");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memberi like.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggleLike}
        disabled={isLoading}
        className="flex items-center gap-2 text-sm text-black/60 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Like post"
        aria-pressed={isLiked}
      >
        <Image
          src={isLiked ? "/icons/Like-Icon-Active.svg" : "/icons/Like-Icon.svg"}
          alt="Likes"
          width={20}
          height={20}
          className="shrink-0"
        />
        <span>{likes}</span>
      </button>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
