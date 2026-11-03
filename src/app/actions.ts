"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  // Chỉ đăng xuất thiết bị này (mặc định của Supabase là mọi thiết bị).
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
