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

export type UpdatePostParams = {
  id: number;
  title?: string;
  content?: string;
  tags?: string[];
  image?: File | null;
  removeImage?: boolean;
};

export async function updatePost(params: UpdatePostParams, token: string) {
  const formData = new FormData();

  if (typeof params.title === "string") formData.append("title", params.title);
  if (typeof params.content === "string")
    formData.append("content", params.content);

  if (params.tags) {
    // Update endpoint expects `tags` as a string (JSON array string or comma-separated).
    formData.append("tags", JSON.stringify(params.tags));
  }

  if (params.image) {
    formData.append("image", params.image);
  }

  if (params.removeImage) {
    formData.append("removeImage", "true");
  }

  return fetchAPI<Post>(`/posts/${params.id}`, {
    method: "PATCH",
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

export type PostCommentForStats = {
  id: number;
  content: string;
  createdAt: string;
  author: UserSummary;
};

export async function getPostCommentsForStats(postId: number) {
  return fetchAPI<PostCommentForStats[]>(`/posts/${postId}/comments`, {
    cache: "no-store",
  });
}

export type GetMyPostsParams = {
  limit?: number;
  page?: number;
};

export async function getMyPosts(params: GetMyPostsParams, token: string) {
  const limit = params.limit ?? 10;
  const page = params.page ?? 1;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  return fetchAPI<PaginatedResponse<Post>>(
    `/posts/my-posts?${searchParams.toString()}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export type DeletePostResponse = {
  success: boolean;
};

export async function deletePost(postId: number, token: string) {
  return fetchAPI<DeletePostResponse>(`/posts/${postId}`, {
    method: "DELETE",
    token,
  });
}
