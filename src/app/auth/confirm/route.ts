import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link trong email đăng nhập trỏ về đây.
// - token_hash + type: từ mẫu email của dự án (supabase/templates), mở bằng
//   trình duyệt nào cũng đăng nhập được.
// - code: từ mẫu email mặc định của Supabase, phải mở trên cùng trình duyệt
//   đã nhập email.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  redirect(ok ? "/" : "/login?error=link");
}
