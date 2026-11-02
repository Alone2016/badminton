import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

// Supabase client cho Server Component, Server Action và Route Handler.
// Tạo mới cho mỗi request, không dùng chung.
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component không ghi được cookie. Bỏ qua được vì
          // proxy.ts đã làm mới phiên đăng nhập ở mỗi request.
        }
      },
    },
  });
}
