import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { listMembers, listRecentCourts } from "@/lib/sessions";
import { roundedNow } from "@/lib/week";
import { FormPage, FormSkeleton } from "../form-page";
import { SessionForm } from "../session-form";

export const metadata: Metadata = { title: "Thêm buổi · Cầu lông" };

export default function NewSessionPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-4 sm:pt-10">
      <Suspense fallback={<FormSkeleton />}>
        <NewSession />
      </Suspense>
    </main>
  );
}

async function NewSession() {
  const { member } = await getViewer();
  if (!member) redirect("/");

  const [members, recentCourts] = await Promise.all([
    listMembers(),
    listRecentCourts(),
  ]);
  const { date, time } = roundedNow(new Date());

  return (
    <FormPage title="Thêm buổi" backHref="/">
      <SessionForm
        members={members}
        recentCourts={recentCourts}
        initial={{
          date,
          time,
          durationMinutes: 120,
          // Nhóm thường đánh một sân quen: điền sẵn sân gần nhất.
          court: recentCourts[0] ?? "",
          costVnd: 0,
          // Người nhập thường cũng là người chơi.
          memberIds: [member.id],
          guestNames: [],
        }}
      />
    </FormPage>
  );
}
