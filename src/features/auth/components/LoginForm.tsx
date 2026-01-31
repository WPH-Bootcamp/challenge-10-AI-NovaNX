"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { login } from "@/features/auth/api";
import { ApiError } from "@/lib/api";
import { setAuthToken } from "@/features/auth/token";

export function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const emailError = (() => {
    if (!submitted) return "";
    if (!email.trim()) return "Enter your valid email address";
    // Basic email validation for slicing & UX.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter your valid email address";
    return "";
  })();

  const passwordError = (() => {
    if (!submitted) return "";
    if (!password.trim()) return "Enter your valid password";
    return "";
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    const emailErr =
      !emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
        ? "Enter your valid email address"
        : "";
    const passwordErr = !passwordTrimmed ? "Enter your valid password" : "";
    if (emailErr || passwordErr) return;

    try {
      setIsSubmitting(true);
      const result = await login({
        email: emailTrimmed,
        password: passwordTrimmed,
      });

      setAuthToken(result.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black/70">Email</label>
          <Input
            placeholder="Enter your email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={
              emailError ? "border-rose-500 focus:ring-rose-200" : undefined
            }
          />
          {emailError ? (
            <p className="text-xs text-rose-600">{emailError}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black/70">Password</label>
          <div className="relative">
            <Input
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={
                (passwordError ? "border-rose-500 focus:ring-rose-200 " : "") +
                "pr-12"
              }
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60"
            >
              {showPassword ? (
                <Image
                  src="/icons/eye.svg"
                  alt="Hide password"
                  width={20}
                  height={20}
                  className="opacity-70"
                />
              ) : (
                <Image
                  src="/icons/eye-off.svg"
                  alt="Show password"
                  width={20}
                  height={20}
                  className="opacity-70"
                />
              )}
            </button>
          </div>
          {passwordError ? (
            <p className="text-xs text-rose-600">{passwordError}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={
            "mt-2 h-12 w-full rounded-full bg-sky-600 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(2,132,199,0.25)] transition hover:bg-sky-700 " +
            (isSubmitting ? "cursor-not-allowed opacity-60" : "")
          }
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {serverError ? (
          <p className="text-center text-xs text-rose-600">{serverError}</p>
        ) : null}

        <p className="pt-2 text-center text-sm text-black/60">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            Register
          </Link>
        </p>
      </div>
    </form>
  );
}
