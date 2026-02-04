"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { clearAuthToken } from "@/features/auth/token";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { getMyProfile, resolveBackendUrl } from "@/features/users/api";
import { ApiError } from "@/lib/api";

export function Header() {
  const pathname = usePathname();
  const token = useAuthToken();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    if (process.env.NODE_ENV !== "production") {
      console.log("[Header] token present, fetching /users/me");
    }

    getMyProfile(token)
      .then((profile) => {
        if (cancelled) return;

        if (process.env.NODE_ENV !== "production") {
          console.log("[Header] /users/me profile received", {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
          });
        }

        setAvatarUrl(
          profile.avatarUrl ? resolveBackendUrl(profile.avatarUrl) : null,
        );
      })
      .catch((err) => {
        if (cancelled) return;

        if (process.env.NODE_ENV !== "production") {
          console.log("[Header] /users/me failed", err);
        }

        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken();
          return;
        }
      })
      .finally(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isAuthed = hasHydrated && Boolean(token);
  const isWritePost = pathname === "/write-post";

  const rightSlot = useMemo(() => {
    if (!hasHydrated) {
      return <div className="h-10 w-10 rounded-full bg-black/5" />;
    }

    if (!isAuthed) {
      return (
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Search"
            className="rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black/80"
          >
            <Image
              src="/icons/searchicon.svg"
              alt="Search"
              width={20}
              height={20}
            />
          </button>
          <button
            type="button"
            aria-label="Menu"
            className="rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black/80"
          >
            <Image
              src="/icons/burgerMenu.svg"
              alt="Menu"
              width={20}
              height={20}
            />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <Image
              src="/icons/avatar-placeholder.svg"
              alt="Avatar"
              fill
              sizes="40px"
              className="object-cover"
            />
          )}
        </div>
      </div>
    );
  }, [avatarUrl, hasHydrated, isAuthed]);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto w-full max-w-107.5 px-4 py-3">
        <div className="flex items-center justify-between">
          {isWritePost ? (
            <div className="flex items-center gap-2">
              <Link
                href="/home"
                aria-label="Back"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-black/70 hover:bg-black/5 hover:text-black/90"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <span className="text-[16px] font-semibold text-black/90">
                Write Post
              </span>
            </div>
          ) : (
            <Link href="/home" className="flex items-center gap-2">
              <Image
                src="/icons/logosymbol.svg"
                alt="Logo"
                width={24}
                height={24}
                priority
              />
              <span className="text-sm font-semibold text-black/90">
                Your Logo
              </span>
            </Link>
          )}

          {rightSlot}
        </div>
      </div>
      <div className="mx-auto w-full max-w-107.5 px-4">
        <div className="border-t border-[#D5D7DA]" />
      </div>
    </header>
  );
}
