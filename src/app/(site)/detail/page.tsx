import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Detail from "../detail";

import { getPostById, searchPosts } from "@/features/posts/api";

const TARGET_TITLE = "5 Reasons to Learn Frontend Development in 2025";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveTargetPostId() {
  const result = await searchPosts({ query: TARGET_TITLE, limit: 50, page: 1 });
  const wanted = TARGET_TITLE.trim().toLowerCase();

  const exactMatches = (result.data ?? []).filter(
    (p) => (p.title ?? "").trim().toLowerCase() === wanted,
  );

  const candidates = exactMatches.length ? exactMatches : result.data ?? [];
  if (!candidates.length) return null;

  // Prefer the newest post (createdAt), fallback to highest id.
  const sorted = [...candidates].sort((a, b) => {
    const at = new Date(a.createdAt).getTime();
    const bt = new Date(b.createdAt).getTime();
    if (!Number.isNaN(at) && !Number.isNaN(bt) && bt !== at) return bt - at;
    return (b.id ?? 0) - (a.id ?? 0);
  });

  return sorted[0]?.id ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const id = await resolveTargetPostId();
  if (!id) return { title: "Post not found" };

  const post = await getPostById(id).catch(() => null);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.content?.slice(0, 140),
  };
}

export default async function DetailPage() {
  const id = await resolveTargetPostId();
  if (!id) notFound();

  const post = await getPostById(id).catch(() => null);
  if (!post) notFound();

  return <Detail post={post} />;
}
