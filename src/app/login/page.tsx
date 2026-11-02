import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Đăng nhập – Cầu lông",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="text-4xl" aria-hidden>
          🏸
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Cầu lông</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ghi chép buổi đánh của nhóm theo tuần
        </p>
      </div>

      <Suspense fallback={null}>
        <LinkError searchParams={searchParams} />
      </Suspense>

      <LoginForm />
    </main>
  );
}

async function LinkError({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  if (error !== "link") return null;

  return (
    <p
      role="alert"
      className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Link đăng nhập không hợp lệ hoặc đã hết hạn. Nhập email để nhận link mới.
    </p>
  );
}
