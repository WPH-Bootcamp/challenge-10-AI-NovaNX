import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Detail from "@/app/(site)/detail";
import { getPostById } from "@/features/posts/api";

type PageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return { title: "Post not found" };

  const post = await getPostById(id).catch(() => null);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: (post.content ?? "").slice(0, 140),
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const post = await getPostById(id).catch(() => null);
  if (!post) notFound();

  return <Detail post={post} />;
}
