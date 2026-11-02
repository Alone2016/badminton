// Đọc biến môi trường Supabase. Phải viết đúng `process.env.NEXT_PUBLIC_...`
// để Next.js nhúng được giá trị khi build.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copy .env.example thành .env.local rồi điền giá trị (xem README).",
    );
  }

  return { url, key };
}
