import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { signOut } from "./actions";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const { email, member } = await getViewer();

  if (!member) {
    return <NotMember email={email} />;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">Xin chào</p>
          <h1 className="truncate text-xl font-semibold">{member.name}</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Buổi đánh trong tuần</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Danh sách buổi và thống kê tuần sẽ có ở bản cập nhật tiếp theo.
        </p>
      </section>
    </>
  );
}

function NotMember({ email }: { email: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h1 className="text-lg font-semibold">Bạn chưa có trong nhóm</h1>
      <p className="mt-2 text-sm text-zinc-700">
        Email <strong className="break-all">{email}</strong> đã đăng nhập nhưng
        chưa có trong danh sách thành viên. Nhờ quản trị nhóm thêm email này vào
        rồi tải lại trang.
      </p>
      <div className="mt-4">
        <SignOutButton />
      </div>
    </section>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Đăng xuất
      </button>
    </form>
  );
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Đang tải">
      <div className="h-4 w-16 rounded bg-zinc-200" />
      <div className="mt-2 h-6 w-40 rounded bg-zinc-200" />
      <div className="mt-6 h-24 rounded-2xl bg-zinc-200" />
    </div>
  );
}
