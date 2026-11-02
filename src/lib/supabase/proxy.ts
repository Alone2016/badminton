import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

// Các trang không cần đăng nhập.
function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth/");
}

// Làm mới phiên đăng nhập Supabase ở mỗi request và chuyển người chưa
// đăng nhập về /login. Đây chỉ là kiểm tra nhanh; quyền đọc/ghi dữ liệu
// thật sự do Row Level Security trên database quyết định.
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  // Header chống cache mà Supabase yêu cầu khi có ghi cookie đăng nhập.
  let authHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        authHeaders = headers;
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Không chèn code giữa createServerClient và getClaims().
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const redirectTo = (pathname: string, keepSearch = false) => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    if (!keepSearch) target.search = "";
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(authHeaders).forEach(([k, v]) => redirect.headers.set(k, v));
    return redirect;
  };

  const { pathname, searchParams } = request.nextUrl;

  // Link trong email lỡ trỏ về trang khác (vd: trang chủ) thì chuyển sang /auth/confirm.
  if (
    pathname !== "/auth/confirm" &&
    (searchParams.has("token_hash") || searchParams.has("code"))
  ) {
    return redirectTo("/auth/confirm", true);
  }

  if (!isLoggedIn && !isPublicPath(pathname)) {
    return redirectTo("/login");
  }

  if (isLoggedIn && pathname === "/login") {
    return redirectTo("/");
  }

  return response;
}
