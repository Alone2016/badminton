import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Không tìm thấy</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Trang hoặc buổi đánh này không tồn tại, có thể đã bị xóa.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-12 items-center rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700"
        >
          Về danh sách tuần
        </Link>
      </section>
    </main>
  );
}
