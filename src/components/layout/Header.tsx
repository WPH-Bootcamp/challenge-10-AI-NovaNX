"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/Input";
import { clearAuthToken } from "@/features/auth/token";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { getMyProfile, resolveBackendUrl } from "@/features/users/api";
import { ApiError } from "@/lib/api";

const PROFILE_CACHE_KEY = "blog_profile_cache_v1";

type CachedProfile = {
  avatarUrl: string | null;
  name: string | null;
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthToken();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const avatarMenuMobileRootRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuDesktopRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!isAvatarMenuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsAvatarMenuOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;

      const mobileRoot = avatarMenuMobileRootRef.current;
      const desktopRoot = avatarMenuDesktopRootRef.current;
      if (mobileRoot && mobileRoot.contains(target)) return;
      if (desktopRoot && desktopRoot.contains(target)) return;
      setIsAvatarMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isAvatarMenuOpen]);

  useEffect(() => {
    if (!isGuestMenuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsGuestMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isGuestMenuOpen]);

  useEffect(() => {
    if (!isGuestMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isGuestMenuOpen]);

  useEffect(() => {
    queueMicrotask(() => setIsGuestMenuOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setAvatarUrl(null);
        setProfileName(null);
      });
      return;
    }

    let cancelled = false;

    // Optimistic: re-use last known profile data to avoid avatar flicker
    // between route transitions (esp. on mobile).
    try {
      const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Partial<CachedProfile>;
        queueMicrotask(() => {
          if (cancelled) return;
          setAvatarUrl((prev) => {
            if (prev) return prev;
            return typeof cached.avatarUrl === "string"
              ? cached.avatarUrl
              : prev;
          });
          setProfileName((prev) => {
            if (prev) return prev;
            return typeof cached.name === "string" ? cached.name : prev;
          });
        });
      }
    } catch {
      // ignore cache issues
    }

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

        const nextAvatarUrl = profile.avatarUrl
          ? resolveBackendUrl(profile.avatarUrl)
          : null;
        const nextName = profile.name ?? null;

        setAvatarUrl(nextAvatarUrl);
        setProfileName(nextName);

        try {
          const payload: CachedProfile = {
            avatarUrl: nextAvatarUrl,
            name: nextName,
          };
          window.localStorage.setItem(
            PROFILE_CACHE_KEY,
            JSON.stringify(payload),
          );
        } catch {
          // ignore cache issues
        }
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
  const isEditPost =
    pathname.startsWith("/posts/") && pathname.endsWith("/edit");
  const isSearchPage =
    pathname === "/search" || pathname.startsWith("/search/");
  const isHomePage = pathname === "/home" || pathname === "/";
  const isDetailPage = pathname === "/detail";
  const isPostDetailPage = pathname.startsWith("/posts/") && !isEditPost;
  const isProfilePage = pathname === "/profile";
  const showAuthedHomeHeader =
    (isHomePage ||
      isSearchPage ||
      isDetailPage ||
      isPostDetailPage ||
      isProfilePage) &&
    !isWritePost &&
    !isEditPost;
  const headerQuery = isSearchPage ? (searchParams.get("q") ?? "") : "";
  const showMobileSearchButton = !isSearchPage && !(isWritePost || isEditPost);

  const [backHref, setBackHref] = useState("/profile");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from") ?? "";
    const next =
      from && from.startsWith("/") && !from.startsWith("//")
        ? from
        : "/profile";

    queueMicrotask(() => setBackHref(next));
  }, [pathname]);

  const avatarMenuDesktop = useMemo(() => {
    return (
      <div ref={avatarMenuDesktopRootRef} className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={isAvatarMenuOpen}
          onClick={() => setIsAvatarMenuOpen((v) => !v)}
          className="flex shrink-0 items-center gap-3 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black/10"
        >
          <span className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5">
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
          </span>

          {showAuthedHomeHeader ? (
            <span className="text-sm font-semibold text-black/80">
              {profileName ?? ""}
            </span>
          ) : null}
        </button>

        {isAvatarMenuOpen ? (
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsAvatarMenuOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-black/80 hover:bg-black/5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-black/70"
              >
                <path
                  d="M20 21a8 8 0 1 0-16 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Profile
            </button>

            <div className="h-px bg-black/10" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsAvatarMenuOpen(false);
                clearAuthToken();
                router.push("/login");
                router.refresh();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-black/80 hover:bg-black/5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-black/70"
              >
                <path
                  d="M10 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 21V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    );
  }, [avatarUrl, isAvatarMenuOpen, profileName, router, showAuthedHomeHeader]);

  const rightSlotMobile = useMemo(() => {
    if (!hasHydrated) {
      return (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
          <Image
            src="/icons/avatar-placeholder.svg"
            alt="Avatar"
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      );
    }

    if (!isAuthed) {
      if (isSearchPage) {
        return (
          <Link
            href="/login"
            aria-label="Login"
            className="relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black/10"
          >
            <Image
              src="/icons/avatar-placeholder.svg"
              alt="Avatar"
              fill
              sizes="40px"
              className="object-cover"
            />
          </Link>
        );
      }

      return (
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black/80"
          >
            <Image
              src="/icons/searchicon.svg"
              alt="Search"
              width={20}
              height={20}
            />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={isGuestMenuOpen}
            onClick={() => setIsGuestMenuOpen(true)}
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
        {showMobileSearchButton ? (
          <Link
            href="/search"
            aria-label="Search"
            className="mr-4 rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black/80"
          >
            <Image
              src="/icons/searchicon.svg"
              alt="Search"
              width={20}
              height={20}
            />
          </Link>
        ) : null}

        <div ref={avatarMenuMobileRootRef} className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={isAvatarMenuOpen}
            onClick={() => setIsAvatarMenuOpen((v) => !v)}
            className="flex shrink-0 items-center rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black/10"
          >
            <span className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5">
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
            </span>
          </button>

          {isAvatarMenuOpen ? (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAvatarMenuOpen(false);
                  router.push("/profile");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-black/80 hover:bg-black/5"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="text-black/70"
                >
                  <path
                    d="M20 21a8 8 0 1 0-16 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Profile
              </button>

              <div className="h-px bg-black/10" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAvatarMenuOpen(false);
                  clearAuthToken();
                  router.push("/login");
                  router.refresh();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-black/80 hover:bg-black/5"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="text-black/70"
                >
                  <path
                    d="M10 17l5-5-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12H3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M21 21V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }, [
    avatarUrl,
    hasHydrated,
    isAuthed,
    isAvatarMenuOpen,
    isGuestMenuOpen,
    isSearchPage,
    router,
    showMobileSearchButton,
  ]);

  const rightSlotDesktop = useMemo(() => {
    if (!hasHydrated) {
      return <div className="h-10 w-10 rounded-full bg-black/5" />;
    }

    if (!isAuthed) {
      return (
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#2F80ED] underline"
          >
            Login
          </Link>

          <span aria-hidden="true" className="h-6 w-px bg-black/15" />

          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#2F80ED] px-10 text-sm font-semibold text-white hover:bg-[#2F80ED]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            Register
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        {showAuthedHomeHeader ? (
          <Link
            href={`/write-post?from=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 underline"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-sky-700"
            >
              <path
                d="M12 20h9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            Write Post
          </Link>
        ) : null}

        {showAuthedHomeHeader ? (
          <span aria-hidden="true" className="mx-4 h-6 w-px bg-black/15" />
        ) : null}

        {avatarMenuDesktop}
      </div>
    );
  }, [
    avatarMenuDesktop,
    hasHydrated,
    isAuthed,
    pathname,
    showAuthedHomeHeader,
  ]);

  return (
    <>
      {/* Mobile default header */}
      <header className="sticky top-0 z-50 bg-white md:hidden">
        <div className="mx-auto w-full max-w-107.5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              {isWritePost || isEditPost ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={backHref}
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
                    {isEditPost ? "Edit Post" : "Write Post"}
                  </span>
                </div>
              ) : (
                <Link href="/home" className="flex min-w-0 items-center gap-2">
                  <Image
                    src="/icons/logosymbol.svg"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                    priority
                  />
                  <span className="truncate text-sm font-semibold text-black/90">
                    Your Logo
                  </span>
                </Link>
              )}
            </div>

            <div className="shrink-0">{rightSlotMobile}</div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-107.5 px-4">
          <div className="border-t border-[#D5D7DA]" />
        </div>
      </header>

      {/* Desktop (md+) header */}
      <header className="sticky top-0 z-50 hidden bg-white md:block">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-8">
            <div className="min-w-0">
              {isWritePost || isEditPost ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={backHref}
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
                    {isEditPost ? "Edit Post" : "Write Post"}
                  </span>
                </div>
              ) : (
                <Link href="/home" className="flex min-w-0 items-center gap-2">
                  <Image
                    src="/icons/logosymbol.svg"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                    priority
                  />
                  <span className="truncate text-sm font-semibold text-black/90">
                    Your Logo
                  </span>
                </Link>
              )}
            </div>

            {hasHydrated && !(isWritePost || isEditPost) ? (
              <div className="flex items-center justify-center">
                {isSearchPage ? (
                  <div className="relative w-full max-w-110">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35">
                      <Image
                        src="/icons/searchicon.svg"
                        alt="Search"
                        width={18}
                        height={18}
                      />
                    </span>
                    <Input
                      value={headerQuery}
                      onChange={(e) => {
                        const next = e.target.value;
                        router.replace(
                          next
                            ? `/search?q=${encodeURIComponent(next)}`
                            : "/search",
                          { scroll: false },
                        );
                      }}
                      placeholder="Search"
                      autoFocus
                      className="h-11 rounded-2xl pl-12 text-[15px]"
                    />
                  </div>
                ) : isHomePage ||
                  isDetailPage ||
                  isPostDetailPage ||
                  isProfilePage ||
                  !isAuthed ? (
                  <Link
                    href="/search"
                    aria-label="Search"
                    className="relative w-full max-w-110"
                  >
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                      <Image
                        src="/icons/searchicon.svg"
                        alt="Search"
                        width={18}
                        height={18}
                      />
                    </span>
                    <div className="flex h-11 w-full items-center rounded-2xl border border-black/10 bg-white pl-12 pr-4 text-sm text-black/50">
                      Search
                    </div>
                  </Link>
                ) : (
                  <div className="w-full max-w-110" />
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="shrink-0 justify-self-end">{rightSlotDesktop}</div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="border-t border-[#D5D7DA]" />
        </div>
      </header>

      {hasHydrated && !isAuthed && isGuestMenuOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guest menu"
          className="fixed inset-0 z-100 bg-white md:hidden"
        >
          <div className="mx-auto w-full max-w-107.5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/logosymbol.svg"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                  priority
                />
                <span className="text-sm font-semibold text-black/90">
                  Your Logo
                </span>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsGuestMenuOpen(false)}
                className="rounded-lg p-2 text-black/70 hover:bg-black/5 hover:text-black/90"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-107.5 px-4">
            <div className="border-t border-[#D5D7DA]" />
          </div>

          <div className="mx-auto flex w-full max-w-107.5 flex-1 flex-col items-center px-4 pt-16">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#2F80ED] underline"
              onClick={() => setIsGuestMenuOpen(false)}
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() => setIsGuestMenuOpen(false)}
              className="mt-6 inline-flex h-12 w-full max-w-65 items-center justify-center rounded-full bg-[#2F80ED] text-sm font-semibold text-white hover:bg-[#2F80ED]/90"
            >
              Register
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
