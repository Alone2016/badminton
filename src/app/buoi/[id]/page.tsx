import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getSession, listMembers, listRecentCourts } from "@/lib/sessions";
import { currentMonday, mondayOf, vnDate, vnTime, weekHref } from "@/lib/week";
import { DeleteSession } from "../delete-session";
import { FormPage, FormSkeleton } from "../form-page";
import { SessionForm } from "../session-form";

export const metadata: Metadata = { title: "Sửa buổi · Cầu lông" };

export default function EditSessionPage({ params }: PageProps<"/buoi/[id]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-4 pb-10 sm:pt-10">
      <Suspense fallback={<FormSkeleton />}>
        <EditSession params={params} />
      </Suspense>
    </main>
  );
}

async function EditSession({ params }: Pick<PageProps<"/buoi/[id]">, "params">) {
  const { member } = await getViewer();
  if (!member) redirect("/");

  const { id } = await params;
  const [session, members, recentCourts] = await Promise.all([
    getSession(id),
    listMembers(),
    listRecentCourts(),
  ]);
  if (!session) notFound();

  const startedAt = new Date(session.startedAt);
  const date = vnDate(startedAt);
  const week = mondayOf(date);
  const backHref = weekHref(week, currentMonday(new Date()));

  return (
    <FormPage title="Sửa buổi" backHref={backHref}>
      <SessionForm
        sessionId={session.id}
        members={members}
        recentCourts={recentCourts}
        initial={{
          date,
          time: vnTime(startedAt),
          durationMinutes: session.durationMinutes,
          court: session.court,
          costVnd: session.costVnd,
          memberIds: session.players.flatMap((p) =>
            p.memberId ? [p.memberId] : [],
          ),
          guestNames: session.players.flatMap((p) =>
            p.isGuest ? [p.name] : [],
          ),
        }}
      />

      {session.creatorName && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Tạo bởi {session.creatorName}
        </p>
      )}

      <div className="mt-6 border-t border-zinc-200 pt-6">
        <DeleteSession sessionId={session.id} week={week} />
      </div>
    </FormPage>
  );
}
