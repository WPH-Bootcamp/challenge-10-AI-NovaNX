import { fetchAPI } from "@/lib/api";
import type { PaginatedResponse, Post } from "@/types/blog";

export type GetRecommendedPostsParams = {
  limit?: number;
  page?: number;
};

export async function getRecommendedPosts(params?: GetRecommendedPostsParams) {
  const limit = params?.limit ?? 10;
  const page = params?.page ?? 1;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  return fetchAPI<PaginatedResponse<Post>>(
    `/posts/recommended?${searchParams.toString()}`,
    {
      cache: "no-store",
    },
  );
}
