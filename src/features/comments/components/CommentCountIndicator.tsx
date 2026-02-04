"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getCommentsByPostId } from "@/features/comments/api";
import {
  COMMENTS_COUNT_CHANGED_EVENT,
  type CommentsCountChangedDetail,
} from "@/features/comments/events";

type Props = {
  postId: number;
  initialCount: number;
};

export function CommentCountIndicator({ postId, initialCount }: Props) {
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    let cancelled = false;

    getCommentsByPostId(postId)
      .then((comments) => {
        if (cancelled) return;
        setCount(comments.length);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    function onChanged(e: Event) {
      const custom = e as CustomEvent<CommentsCountChangedDetail>;
      if (!custom.detail) return;
      if (custom.detail.postId !== postId) return;
      setCount(custom.detail.count);
    }

    window.addEventListener(COMMENTS_COUNT_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(COMMENTS_COUNT_CHANGED_EVENT, onChanged);
    };
  }, [postId]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Image
        src="/icons/Comment-Icon.svg"
        alt="Comments"
        width={20}
        height={20}
      />
      <span>{count}</span>
    </div>
  );
}
