export type UserSummary = {
  id: number;
  name: string;
  username?: string;
  email?: string;
  headline?: string;
  avatarUrl?: string | null;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string | null;
  author: UserSummary;
  createdAt: string;
  likes: number;
  comments: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
};
