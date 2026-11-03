"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { isUuid } from "@/lib/sessions";
import {
  currentMonday,
  isDateString,
  isTimeString,
  mondayOf,
  vnDateTimeToIso,
  weekHref,
} from "@/lib/week";

export type SessionField =
  | "date"
  | "time"
  | "duration"
  | "court"
  | "cost"
  | "players";

export type SessionFormState = {
  message?: string;
  errors?: Partial<Record<SessionField, string>>;
};

export type DeleteSessionState = { message?: string };

const MAX_GUESTS = 30;
const MAX_COST_VND = 1_000_000_000;

type ParsedSession = {
  id: string | null;
  date: string;
  startedAt: string;
  durationMinutes: number;
  court: string;
  costVnd: number;
  memberIds: string[];
  guestNames: string[];
};

function parseSessionForm(
  formData: FormData,
):
  | { ok: true; value: ParsedSession }
  | { ok: false; errors: SessionFormState["errors"] } {
  const errors: NonNullable<SessionFormState["errors"]> = {};
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const rawId = text("id");
  const id = rawId === "" ? null : rawId;
  if (id !== null && !isUuid(id)) {
    throw new Error("Invalid session id");
  }

  const date = text("date");
  if (!isDateString(date)) errors.date = "Chọn ngày.";

  const time = text("time");
  if (!isTimeString(time)) errors.time = "Chọn giờ bắt đầu.";

  const durationText = text("duration");
  const durationMinutes = Number(durationText);
  if (
    !/^\d+$/.test(durationText) ||
    durationMinutes < 1 ||
    durationMinutes > 1440
  ) {
    errors.duration = "Thời lượng từ 1 đến 1440 phút.";
  }

  const court = text("court");
  if (court.length === 0) errors.court = "Nhập tên sân.";
  else if (court.length > 120) errors.court = "Tên sân tối đa 120 ký tự.";

  // Cho phép gõ "150.000", "150,000", "150 000 ₫"; bỏ trống = 0.
  const costText = text("cost").replace(/[\s.,₫đ]/gi, "");
  const costVnd = costText === "" ? 0 : Number(costText);
  if (!/^\d*$/.test(costText) || costVnd > MAX_COST_VND) {
    errors.cost = "Chi phí là số tiền (VNĐ), ví dụ 150.000.";
  }

  const memberIds = [
    ...new Set(formData.getAll("member_id").map(String).filter(isUuid)),
  ];
  const guestNames = [
    ...new Set(
      formData
        .getAll("guest_name")
        .map((g) => String(g).trim())
        .filter((g) => g.length > 0),
    ),
  ];
  if (guestNames.some((g) => g.length > 80)) {
    errors.players = "Tên khách tối đa 80 ký tự.";
  } else if (guestNames.length > MAX_GUESTS) {
    errors.players = `Tối đa ${MAX_GUESTS} khách.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      id,
      date,
      startedAt: vnDateTimeToIso(date, time),
      durationMinutes,
      court,
      costVnd,
      memberIds,
      guestNames,
    },
  };
}

export async function saveSession(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const { supabase } = await requireMember();

  const parsed = parseSessionForm(formData);
  if (!parsed.ok) {
    return { message: "Kiểm tra lại các ô báo đỏ.", errors: parsed.errors };
  }
  const s = parsed.value;

  const { error } = await supabase.rpc("save_play_session", {
    p_started_at: s.startedAt,
    p_duration_minutes: s.durationMinutes,
    p_court: s.court,
    p_cost_vnd: s.costVnd,
    p_member_ids: s.memberIds,
    p_guest_names: s.guestNames,
    ...(s.id ? { p_id: s.id } : {}),
  });

  if (error) {
    console.error("save_play_session failed", error);
    if (error.code === "P0002") {
      return { message: "Buổi này đã bị người khác xóa." };
    }
    if (error.code === "23503") {
      return {
        message: "Danh sách thành viên vừa thay đổi. Tải lại trang rồi thử lại.",
      };
    }
    return { message: "Không lưu được. Kiểm tra mạng rồi thử lại." };
  }

  // Về đúng tuần của buổi vừa lưu.
  revalidatePath("/");
  redirect(weekHref(mondayOf(s.date), currentMonday(new Date())));
}

export async function deleteSession(
  _prev: DeleteSessionState,
  formData: FormData,
): Promise<DeleteSessionState> {
  const { supabase } = await requireMember();

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) throw new Error("Invalid session id");
  const back = String(formData.get("week") ?? "");

  const { error } = await supabase.from("play_sessions").delete().eq("id", id);
  if (error) {
    console.error("delete play_session failed", error);
    return { message: "Không xóa được. Kiểm tra mạng rồi thử lại." };
  }

  const thisMonday = currentMonday(new Date());
  revalidatePath("/");
  redirect(weekHref(isDateString(back) ? mondayOf(back) : thisMonday, thisMonday));
}
