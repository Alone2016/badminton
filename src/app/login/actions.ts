"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error";
  email?: string;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", email, message: "Email không hợp lệ." };
  }

  const supabase = await createClient();

  // Chỉ gửi link cho email có trong danh sách thành viên.
  const { data: allowed, error: checkError } = await supabase.rpc(
    "can_sign_in",
    { p_email: email },
  );
  if (checkError) {
    console.error("can_sign_in failed", checkError);
    return {
      status: "error",
      email,
      message: "Không kiểm tra được email lúc này. Thử lại sau ít phút.",
    };
  }
  if (!allowed) {
    return {
      status: "error",
      email,
      message:
        "Email này chưa có trong nhóm. Nhờ quản trị nhóm thêm bạn vào danh sách thành viên.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await getOrigin()}/auth/confirm` },
  });

  if (error) {
    console.error("signInWithOtp failed", error);
    const tooMany =
      error.status === 429 || error.code === "over_email_send_rate_limit";
    return {
      status: "error",
      email,
      message: tooMany
        ? "Đã gửi quá nhiều email. Đợi một lúc rồi thử lại."
        : "Không gửi được email đăng nhập. Thử lại sau ít phút.",
    };
  }

  return { status: "sent", email };
}

// Địa chỉ web đang chạy (localhost khi dev, domain Vercel khi deploy).
async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}
