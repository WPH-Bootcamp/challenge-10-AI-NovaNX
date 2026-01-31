import { API_BASE_URL, fetchAPI } from "@/lib/api";

export type MyProfile = {
  id: number;
  name: string;
  email: string;
  headline?: string;
  avatarUrl?: string | null;
};

export function resolveBackendUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, API_BASE_URL).toString();
}

export async function getMyProfile(token: string) {
  return fetchAPI<MyProfile>("/users/me", {
    method: "GET",
    token,
  });
}
