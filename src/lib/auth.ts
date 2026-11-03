import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Member = { id: string; name: string; email: string };

export type Viewer = {
  email: string;
  // null khi đã đăng nhập nhưng email chưa có trong danh sách thành viên.
  member: Member | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Người đang đăng nhập + thông tin thành viên. Chưa đăng nhập thì về /login.
async function readViewer(supabase: SupabaseClient): Promise<Viewer> {
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
}

// Dùng trong Server Component.
// `cache` để nhiều component trong cùng request chỉ hỏi Supabase một lần.
export const getViewer = cache(async (): Promise<Viewer> => {
  // Kiểm tra phiên so hạn token với giờ hiện tại (Date.now) nên phải chạy
  // theo từng request thật, không prerender/prefetch sẵn.
  await connection();
  return readViewer(await createClient());
});

// Dùng trong Server Action: bắt buộc là thành viên, trả về kèm Supabase client.
// RLS trên database vẫn là lớp chặn chính; đây là lớp kiểm tra sớm.
export async function requireMember() {
  const supabase = await createClient();
  const { member } = await readViewer(supabase);
  if (!member) {
    redirect("/");
  }
  return { supabase, member };
}
