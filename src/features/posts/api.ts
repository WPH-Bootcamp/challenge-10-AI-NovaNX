import { fetchAPI } from "@/lib/api";
import type { PaginatedResponse, Post, UserSummary } from "@/types/blog";

export type GetRecommendedPostsParams = {
  limit?: number;
  page?: number;
};

export type GetMostLikedPostsParams = {
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

export async function getMostLikedPosts(params?: GetMostLikedPostsParams) {
  const limit = params?.limit ?? 10;
  const page = params?.page ?? 1;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  return fetchAPI<PaginatedResponse<Post>>(
    `/posts/most-liked?${searchParams.toString()}`,
    {
      cache: "no-store",
    },
  );
}

export type SearchPostsParams = {
  query: string;
  limit?: number;
  page?: number;
};

export async function searchPosts(params: SearchPostsParams) {
  const limit = params.limit ?? 10;
  const page = params.page ?? 1;

  const searchParams = new URLSearchParams({
    query: params.query,
    limit: String(limit),
    page: String(page),
  });

  return fetchAPI<PaginatedResponse<Post>>(
    `/posts/search?${searchParams.toString()}`,
    {
      cache: "no-store",
    },
  );
}

export async function getPostById(id: number) {
  return fetchAPI<Post>(`/posts/${id}`, {
    cache: "no-store",
  });
}

export type CreatePostParams = {
  title: string;
  content: string;
  tags: string[];
  image: File;
};

export async function createPost(params: CreatePostParams, token: string) {
  const formData = new FormData();
  formData.append("title", params.title);
  formData.append("content", params.content);
  for (const tag of params.tags) formData.append("tags", tag);
  formData.append("image", params.image);

  return fetchAPI<Post>("/posts", {
    method: "POST",
    body: formData,
    token,
  });
}

export async function toggleLikePost(postId: number, token: string) {
  return fetchAPI<Post>(`/posts/${postId}/like`, {
    method: "POST",
    token,
  });
}

export async function getLikesByPost(postId: number) {
  return fetchAPI<UserSummary[]>(`/posts/${postId}/likes`, {
    cache: "no-store",
  });
}
