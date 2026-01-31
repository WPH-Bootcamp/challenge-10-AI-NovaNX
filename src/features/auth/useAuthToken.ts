"use client";

import { useSyncExternalStore } from "react";

import { getAuthToken } from "@/features/auth/token";

function subscribe(callback: () => void) {
  function onStorage(e: StorageEvent) {
    if (e.key !== "blog_api_token") return;
    callback();
  }

  window.addEventListener("auth-token-changed", callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("auth-token-changed", callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return getAuthToken();
}

function getServerSnapshot() {
  return null;
}

export function useAuthToken() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
