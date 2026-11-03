import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { formatDuration, formatTotalHours, formatVnd } from "@/lib/format";
import { listWeekSessions, type PlaySession } from "@/lib/sessions";
import { weekStats, type WeekStats } from "@/lib/stats";
import {
  addDays,
  currentMonday,
  isDateString,
  mondayOf,
  shortDate,
  vnDate,
  vnTime,
  weekdayName,
  weekHref,
  weekLabel,
} from "@/lib/week";
import { signOut } from "./actions";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-6 pb-28 sm:pt-10">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function HomeContent({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const { email, member } = await getViewer();

  if (!member) {
    return <NotMember email={email} />;
  }

  // ?tuan=YYYY-MM-DD (ngày bất kỳ trong tuần); không có thì là tuần hiện tại.
  const { tuan } = await searchParams;
  const thisMonday = currentMonday(new Date());
  const monday = isDateString(tuan) ? mondayOf(tuan) : thisMonday;
  const sessions = await listWeekSessions(monday);

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">Xin chào</p>
          <h1 className="truncate text-xl font-semibold">{member.name}</h1>
        </div>
        <SignOutButton />
      </header>

      <WeekNav monday={monday} thisMonday={thisMonday} />

      <WeekStatsCard stats={weekStats(sessions)} />

      <SessionList sessions={sessions} />

      <AddSessionBar />
    </>
  );
}

function WeekNav({
  monday,
  thisMonday,
}: {
  monday: string;
  thisMonday: string;
}) {
  const offset = Math.round(
    (Date.parse(monday) - Date.parse(thisMonday)) / (7 * 24 * 3600 * 1000),
  );
  const title =
    offset === 0
      ? "Tuần này"
      : offset === -1
        ? "Tuần trước"
        : offset === 1
          ? "Tuần sau"
          : "Tuần";

  const navButton =
    "grid size-12 shrink-0 place-items-center rounded-xl text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200";

  return (
    <div className="mt-6">
      <nav
        aria-label="Chọn tuần"
        className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm"
      >
        <Link
          href={weekHref(addDays(monday, -7), thisMonday)}
          aria-label="Tuần trước"
          className={navButton}
        >
          <ChevronLeft />
        </Link>
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-zinc-500 tabular-nums">
            {weekLabel(monday)}
          </p>
        </div>
        <Link
          href={weekHref(addDays(monday, 7), thisMonday)}
          aria-label="Tuần sau"
          className={navButton}
        >
          <ChevronRight />
        </Link>
      </nav>
      {offset !== 0 && (
        <div className="mt-2 text-center">
          <Link
            href="/"
            className="inline-block px-3 py-2 text-sm font-medium text-emerald-700 underline"
          >
            Về tuần này
          </Link>
        </div>
      )}
    </div>
  );
}

// Điện thoại: 2 ô trên, chi phí một hàng dưới. Máy tính: 3 ô một hàng.
function WeekStatsCard({ stats }: { stats: WeekStats }) {
  return (
    <section aria-label="Thống kê tuần" className="mt-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Số buổi" value={String(stats.sessionCount)} />
        <StatTile
          label="Tổng giờ chơi"
          value={formatTotalHours(stats.totalMinutes)}
          spoken={formatDuration(stats.totalMinutes)}
        />
        <StatTile
          label="Tổng chi phí"
          value={formatVnd(stats.totalCostVnd)}
          className="col-span-2 flex items-baseline justify-between gap-3 sm:col-span-1 sm:block"
        />
      </dl>
    </section>
  );
}

function StatTile({
  label,
  value,
  spoken,
  className = "",
}: {
  label: string;
  value: string;
  /** Cách đọc đầy đủ cho trình đọc màn hình, nếu `value` viết tắt. */
  spoken?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm ${className}`}
    >
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums">
        {spoken ? (
          <>
            <span aria-hidden>{value}</span>
            <span className="sr-only">{spoken}</span>
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function SessionList({ sessions }: { sessions: PlaySession[] }) {
  if (sessions.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
        <p className="font-medium">Chưa có buổi nào trong tuần này</p>
        <p className="mt-1 text-sm text-zinc-500">
          Bấm “Thêm buổi” để ghi lại buổi đánh.
        </p>
      </section>
    );
  }

  // Gom theo ngày (giờ VN), giữ thứ tự giờ bắt đầu.
  const days = new Map<string, PlaySession[]>();
  for (const s of sessions) {
    const day = vnDate(new Date(s.startedAt));
    days.set(day, [...(days.get(day) ?? []), s]);
  }

  return (
    <div className="mt-6 space-y-6">
      {[...days].map(([day, list]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h2
            id={`day-${day}`}
            className="mb-2 text-sm font-semibold text-zinc-500"
          >
            {weekdayName(day)}, {shortDate(day)}
          </h2>
          <ul className="space-y-3">
            {list.map((s) => (
              <li key={s.id}>
                <SessionCard session={s} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SessionCard({ session: s }: { session: PlaySession }) {
  const start = new Date(s.startedAt);
  const end = new Date(start.getTime() + s.durationMinutes * 60 * 1000);

  return (
    <Link
      href={`/buoi/${s.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300 active:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold tabular-nums">
            {vnTime(start)} – {vnTime(end)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            <span className="break-words">{s.court}</span>
            <span className="text-zinc-400"> · </span>
            <span className="whitespace-nowrap">
              {formatDuration(s.durationMinutes)}
            </span>
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {formatVnd(s.costVnd)}
        </p>
      </div>

      {s.players.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Người chơi">
          {s.players.map((p) => (
            <li
              key={p.memberId ?? `guest:${p.name}`}
              className={
                p.isGuest
                  ? "rounded-full border border-dashed border-zinc-300 px-2.5 py-0.5 text-sm text-zinc-600"
                  : "rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm text-emerald-800"
              }
            >
              {p.name}
              {p.isGuest && <span className="text-zinc-400"> (khách)</span>}
            </li>
          ))}
        </ul>
      )}

      {s.creatorName && (
        <p className="mt-3 text-xs text-zinc-400">Tạo bởi {s.creatorName}</p>
      )}
    </Link>
  );
}

// Nút "Thêm buổi" luôn ở đáy màn hình, dễ bấm bằng một tay.
function AddSessionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-xl">
        <Link
          href="/buoi/moi"
          className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
        >
          <span aria-hidden className="text-xl leading-none">
            +
          </span>
          Thêm buổi
        </Link>
      </div>
    </div>
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
      <div className="mt-6 h-16 rounded-2xl bg-zinc-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-19 rounded-2xl bg-zinc-200" />
        <div className="h-19 rounded-2xl bg-zinc-200" />
        <div className="col-span-2 h-13.5 rounded-2xl bg-zinc-200 sm:col-span-1 sm:h-19" />
      </div>
      <div className="mt-6 h-4 w-24 rounded bg-zinc-200" />
      <div className="mt-2 h-28 rounded-2xl bg-zinc-200" />
      <div className="mt-3 h-28 rounded-2xl bg-zinc-200" />
    </div>
  );
}
