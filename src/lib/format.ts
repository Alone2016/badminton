const vndNumber = new Intl.NumberFormat("vi-VN");

/** 150000 -> "150.000" */
export function formatNumber(value: number): string {
  return vndNumber.format(value);
}

/** 150000 -> "150.000 ₫" */
export function formatVnd(value: number): string {
  return `${formatNumber(value)} ₫`;
}

/** 120 -> "2 giờ", 90 -> "1 giờ 30 phút", 45 -> "45 phút" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/** Tổng giờ chơi: 270 -> "4h30", 240 -> "4h", 45 -> "0h45", 0 -> "0h" */
export function formatTotalHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** 120 -> "2h", 90 -> "1h30", 45 -> "45p" (dùng cho nút chọn nhanh) */
export function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
