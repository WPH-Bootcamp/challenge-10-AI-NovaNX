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

export type UpdateProfileRequest = {
  name?: string;
  headline?: string;
  avatar?: File;
};

export async function updateProfile(payload: UpdateProfileRequest, token: string) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.headline !== undefined) formData.append("headline", payload.headline);
  if (payload.avatar) formData.append("avatar", payload.avatar);

  return fetchAPI<MyProfile>("/users/profile", {
    method: "PATCH",
    token,
    body: formData,
  });
}

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

export async function changePassword(
  payload: ChangePasswordRequest,
  token: string,
) {
  return fetchAPI<ChangePasswordResponse>("/users/password", {
    method: "PATCH",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
