import type { Metadata } from "next";
import { Suspense } from "react";

import { PostEditorForm } from "@/features/posts/components/PostEditorForm";

export const metadata: Metadata = {
  title: "Write Post",
};

export default function WritePostPage() {
  return (
    <Suspense
      fallback={<div className="py-6 text-sm text-black/50">Loading…</div>}
    >
      <PostEditorForm mode="create" />
    </Suspense>
  );
}
