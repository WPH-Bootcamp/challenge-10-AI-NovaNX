import { fetchAPI } from "@/lib/api";

export type CommentAuthor = {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string | null;
};

export type Comment = {
  id: number;
  content: string;
  author: CommentAuthor;
  createdAt: string;
};

export async function getCommentsByPostId(postId: number) {
  return fetchAPI<Comment[]>(`/comments/${postId}`, {
    cache: "no-store",
  });
}

export async function addCommentToPost(
  postId: number,
  content: string,
  token: string,
) {
  return fetchAPI<Comment>(`/comments/${postId}`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
}
