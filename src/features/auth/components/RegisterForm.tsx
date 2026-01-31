"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { register } from "@/features/auth/api";
import { ApiError } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const nameError = (() => {
    if (!submitted) return "";
    if (!name.trim()) return "Enter your name";
    return "";
  })();

  const emailError = (() => {
    if (!submitted) return "";
    if (!email.trim()) return "Enter your valid email address";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter your valid email address";
    return "";
  })();

  const passwordError = (() => {
    if (!submitted) return "";
    if (!password.trim()) return "Enter your password";
    return "";
  })();

  const confirmPasswordError = (() => {
    if (!submitted) return "";
    if (!confirmPassword.trim()) return "Confirm your password";
    if (confirmPassword !== password) return "Password does not match";
    return "";
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const nameTrimmed = name.trim();
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    const confirmPasswordTrimmed = confirmPassword.trim();

    const nameErr = !nameTrimmed ? "Enter your name" : "";
    const emailErr =
      !emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
        ? "Enter your valid email address"
        : "";
    const passwordErr = !passwordTrimmed ? "Enter your password" : "";
    const confirmErr = !confirmPasswordTrimmed
      ? "Confirm your password"
      : confirmPasswordTrimmed !== passwordTrimmed
        ? "Password does not match"
        : "";

    if (nameErr || emailErr || passwordErr || confirmErr) return;

    try {
      setIsSubmitting(true);
      await register({
        name: nameTrimmed,
        email: emailTrimmed,
        password: passwordTrimmed,
      });
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Register failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black/70">Name</label>
          <Input
            placeholder="Enter your name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={
              nameError ? "border-rose-500 focus:ring-rose-200" : undefined
            }
          />
          {nameError ? (
            <p className="text-xs text-rose-600">{nameError}</p>
          ) : null}
        </div>

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
              autoComplete="new-password"
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-black/70">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              placeholder="Enter your confirm password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={
                (confirmPasswordError
                  ? "border-rose-500 focus:ring-rose-200 "
                  : "") + "pr-12"
              }
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60"
            >
              {showConfirmPassword ? (
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
          {confirmPasswordError ? (
            <p className="text-xs text-rose-600">{confirmPasswordError}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={
          "mt-6 h-12 w-full rounded-full bg-sky-600 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(2,132,199,0.25)] transition hover:bg-sky-700 " +
          (isSubmitting ? "cursor-not-allowed opacity-60" : "")
        }
      >
        {isSubmitting ? "Registering..." : "Register"}
      </button>

      {serverError ? (
        <p className="pt-3 text-center text-xs text-rose-600">{serverError}</p>
      ) : null}

      <p className="pt-4 text-center text-sm text-black/60">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-sky-600 hover:text-sky-700"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
