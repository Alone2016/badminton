// Thống kê tuần, tính từ chính danh sách buổi đang hiển thị
// nên luôn khớp với danh sách.

export type WeekStats = {
  sessionCount: number;
  totalMinutes: number;
  totalCostVnd: number;
};

export function weekStats(
  sessions: readonly { durationMinutes: number; costVnd: number }[],
): WeekStats {
  let totalMinutes = 0;
  let totalCostVnd = 0;
  for (const s of sessions) {
    totalMinutes += s.durationMinutes;
    totalCostVnd += s.costVnd;
  }
  return { sessionCount: sessions.length, totalMinutes, totalCostVnd };
}
