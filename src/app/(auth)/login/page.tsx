import { LoginForm } from "@/features/auth/components/LoginForm";

type LoginPageProps = {
  searchParams?: {
    registered?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const registered = searchParams?.registered === "1";

  return (
    <main className="min-h-dvh px-4 py-10">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-black/90">
            Sign In
          </h1>
          {registered ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Account created. Please log in.
            </div>
          ) : null}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
