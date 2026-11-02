import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Member = { id: string; name: string; email: string };

export type Viewer = {
  email: string;
  // null khi đã đăng nhập nhưng email chưa có trong danh sách thành viên.
  member: Member | null;
};

// Người đang đăng nhập + thông tin thành viên. Chưa đăng nhập thì về /login.
// Dùng `cache` để nhiều component trong cùng request chỉ hỏi Supabase một lần.
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email?.toLowerCase();

  if (!email) {
    redirect("/login");
  }

  // RLS chỉ trả về dữ liệu nếu người này là thành viên.
  const { data: member } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  return { email, member };
});
