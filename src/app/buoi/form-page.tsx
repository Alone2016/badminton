import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/icons";

// Khung chung cho trang thêm/sửa buổi: nút quay lại + tiêu đề.
export function FormPage({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href={backHref}
          aria-label="Quay lại danh sách tuần"
          className="-ml-2 grid size-11 place-items-center rounded-xl text-zinc-600 hover:bg-zinc-200"
        >
          <ChevronLeft />
        </Link>
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>
      <div className="mt-5">{children}</div>
    </>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Đang tải">
      <div className="h-7 w-40 rounded bg-zinc-200" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-12 rounded-xl bg-zinc-200" />
        <div className="h-12 rounded-xl bg-zinc-200" />
      </div>
      <div className="mt-6 h-11 w-3/4 rounded-full bg-zinc-200" />
      <div className="mt-6 h-12 rounded-xl bg-zinc-200" />
      <div className="mt-6 h-11 w-2/3 rounded-full bg-zinc-200" />
      <div className="mt-6 h-12 rounded-xl bg-zinc-200" />
    </div>
  );
}
