import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh px-4 py-10">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-black/90">
            Sign Up
          </h1>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
