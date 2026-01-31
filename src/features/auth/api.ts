import { fetchAPI } from "@/lib/api";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export async function login(payload: LoginRequest) {
  return fetchAPI<LoginResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  username?: string;
};

export type RegisterResponse = {
  id: number;
  email: string;
  username?: string;
};

export async function register(payload: RegisterRequest) {
  return fetchAPI<RegisterResponse>("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
