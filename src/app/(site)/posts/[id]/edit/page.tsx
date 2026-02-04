import type { Metadata } from "next";

import EditPostClient from "./edit-post-client";

export const metadata: Metadata = {
  title: "Edit Post",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPostClient id={id} />;
}
