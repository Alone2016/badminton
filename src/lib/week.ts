// Ngày giờ theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
//
// Ngày lịch được biểu diễn bằng chuỗi "YYYY-MM-DD" và tính toán bằng Date ở
// múi UTC, nên kết quả không phụ thuộc múi giờ của máy chủ hay trình duyệt.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const WEEKDAYS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

// Lệch theo giờ VN rồi đọc bằng các hàm getUTC*.
function toVn(date: Date) {
  return new Date(date.getTime() + VN_OFFSET_MS);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fromDateString(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" của thời điểm `date` theo giờ VN. */
export function vnDate(date: Date): string {
  return toDateString(toVn(date));
}

/** "HH:MM" của thời điểm `date` theo giờ VN. */
export function vnTime(date: Date): string {
  const d = toVn(date);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Chuỗi "YYYY-MM-DD" hợp lệ (có thật trên lịch) hay không. */
export function isDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    DATE_PATTERN.test(value) &&
    toDateString(fromDateString(value)) === value
  );
}

export function isTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

export function addDays(date: string, days: number): string {
  return toDateString(new Date(fromDateString(date).getTime() + days * DAY_MS));
}

/** Thứ 2 của tuần chứa ngày `date`. */
export function mondayOf(date: string): string {
  const weekday = fromDateString(date).getUTCDay(); // 0 = Chủ nhật
  return addDays(date, -((weekday + 6) % 7));
}

/** Ngày + giờ nhập trên form (giờ VN) -> thời điểm ISO để lưu. */
export function vnDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

/** Khoảng [bắt đầu, kết thúc) của tuần Thứ 2 -> Chủ nhật, dạng ISO. */
export function weekRange(monday: string) {
  return {
    startIso: vnDateTimeToIso(monday, "00:00"),
    endIso: vnDateTimeToIso(addDays(monday, 7), "00:00"),
  };
}

/** "Thứ 3" / "Chủ nhật" của ngày `date`. */
export function weekdayName(date: string): string {
  return WEEKDAYS[fromDateString(date).getUTCDay()];
}

/** "4/11" */
export function shortDate(date: string): string {
  const d = fromDateString(date);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** "2/11 – 8/11/2026" */
export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  return `${shortDate(monday)} – ${shortDate(sunday)}/${sunday.slice(0, 4)}`;
}

/** Thứ 2 của tuần hiện tại (giờ VN). */
export function currentMonday(now: Date): string {
  return mondayOf(vnDate(now));
}

/** Link tới trang tuần; tuần hiện tại dùng "/" cho gọn. */
export function weekHref(monday: string, thisMonday: string): string {
  return monday === thisMonday ? "/" : `/?tuan=${monday}`;
}

/** Giờ hiện tại làm tròn tới 30 phút gần nhất (giờ VN), để điền sẵn vào form. */
export function roundedNow(now: Date): { date: string; time: string } {
  const step = 30 * 60 * 1000;
  const rounded = new Date(Math.round(now.getTime() / step) * step);
  return { date: vnDate(rounded), time: vnTime(rounded) };
}
