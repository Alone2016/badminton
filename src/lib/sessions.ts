import { createClient } from "@/lib/supabase/server";
import { weekRange } from "@/lib/week";

// Đọc dữ liệu buổi đánh. Chỉ gọi từ server (Server Component / Server Action).
// RLS bảo đảm chỉ thành viên mới đọc được.

export type Player = {
  memberId: string | null;
  name: string;
  isGuest: boolean;
};

export type PlaySession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  court: string;
  costVnd: number;
  creatorName: string | null;
  players: Player[];
};

export type MemberOption = { id: string; name: string };

const SESSION_COLUMNS =
  "id, started_at, duration_minutes, court, cost_vnd, creator:members!play_sessions_created_by_fkey(name), players:play_session_players(guest_name, member:members(id, name))";

type SessionRow = {
  id: string;
  started_at: string;
  duration_minutes: number;
  court: string;
  cost_vnd: number;
  creator: { name: string } | null;
  players: {
    guest_name: string | null;
    member: { id: string; name: string } | null;
  }[];
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "vi");

function toPlaySession(row: SessionRow): PlaySession {
  const members: Player[] = [];
  const guests: Player[] = [];
  for (const p of row.players) {
    if (p.member) {
      members.push({ memberId: p.member.id, name: p.member.name, isGuest: false });
    } else if (p.guest_name) {
      guests.push({ memberId: null, name: p.guest_name, isGuest: true });
    }
  }

  return {
    id: row.id,
    startedAt: row.started_at,
    durationMinutes: row.duration_minutes,
    court: row.court,
    costVnd: row.cost_vnd,
    creatorName: row.creator?.name ?? null,
    // Thành viên trước, khách sau; mỗi nhóm xếp theo tên.
    players: [...members.sort(byName), ...guests.sort(byName)],
  };
}

/** Các buổi trong tuần bắt đầu từ Thứ 2 `monday` (giờ VN), xếp theo giờ bắt đầu. */
export async function listWeekSessions(monday: string): Promise<PlaySession[]> {
  const { startIso, endIso } = weekRange(monday);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_sessions")
    .select(SESSION_COLUMNS)
    .gte("started_at", startIso)
    .lt("started_at", endIso)
    .order("started_at")
    .order("created_at")
    .overrideTypes<SessionRow[], { merge: false }>();

  if (error) throw error;
  return data.map(toPlaySession);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Một buổi theo id; null nếu không có (hoặc đã bị xóa). */
export async function getSession(id: string): Promise<PlaySession | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", id)
    .overrideTypes<SessionRow[], { merge: false }>();

  if (error) throw error;
  return data[0] ? toPlaySession(data[0]) : null;
}

/** Danh sách thành viên để chọn người chơi. */
export async function listMembers(): Promise<MemberOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").select("id, name");
  if (error) throw error;
  return data.sort(byName);
}

/** Vài sân dùng gần đây nhất (không trùng), để chọn nhanh. */
export async function listRecentCourts(limit = 4): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_sessions")
    .select("court")
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const seen = new Map<string, string>();
  for (const { court } of data) {
    const key = court.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, court.trim());
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}
