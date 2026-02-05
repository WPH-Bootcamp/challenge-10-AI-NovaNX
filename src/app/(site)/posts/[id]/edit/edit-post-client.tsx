"use client";

import { useQuery } from "@tanstack/react-query";

import { Container } from "@/components/layout/Container";
import { getPostById } from "@/features/posts/api";
import { PostEditorForm } from "@/features/posts/components/PostEditorForm";

export default function EditPostClient({ id }: { id: string }) {
  const rawId = String(id ?? "");
  const normalizedId = rawId.trim();
  const postId = Number.parseInt(normalizedId, 10);
  const isValidId = Number.isFinite(postId) && postId > 0;

  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!isValidId) throw new Error("Invalid post id");
      return getPostById(postId);
    },
    enabled: isValidId,
    staleTime: 0,
  });

  if (!isValidId) {
    return (
      <main>
        <section className="py-6 sm:py-8 md:hidden">
          <Container>
            <div className="text-sm text-red-600">
              Post id tidak valid. (id: {JSON.stringify(rawId)})
            </div>
          </Container>
        </section>

        <section className="hidden py-8 md:block">
          <div className="w-full px-6 md:px-10 lg:px-12">
            <div className="text-sm text-red-600">
              Post id tidak valid. (id: {JSON.stringify(rawId)})
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (postQuery.isLoading) {
    return (
      <main>
        <section className="py-6 sm:py-8 md:hidden">
          <Container>
            <div className="text-sm text-black/50">Loading post…</div>
          </Container>
        </section>

        <section className="hidden py-8 md:block">
          <div className="w-full px-6 md:px-10 lg:px-12">
            <div className="text-sm text-black/50">Loading post…</div>
          </div>
        </section>
      </main>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <main>
        <section className="py-6 sm:py-8 md:hidden">
          <Container>
            <div className="text-sm text-red-600">Gagal memuat post.</div>
          </Container>
        </section>

        <section className="hidden py-8 md:block">
          <div className="w-full px-6 md:px-10 lg:px-12">
            <div className="text-sm text-red-600">Gagal memuat post.</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PostEditorForm
      key={postId}
      mode="edit"
      postId={postId}
      initialPost={postQuery.data}
    />
  );
}
