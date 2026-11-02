"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
        <div className="text-3xl" aria-hidden>
          📬
        </div>
        <h2 className="mt-2 font-semibold">Kiểm tra email</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Đã gửi link đăng nhập tới{" "}
          <strong className="break-all">{state.email}</strong>. Mở email và bấm
          “Đăng nhập”. Không thấy thì xem thêm mục Spam/Quảng cáo.
        </p>
        {/* Tải lại trang để nhập email khác. */}
        <a
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 underline"
        >
          Dùng email khác
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <label htmlFor="email" className="block text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        required
        defaultValue={state.email}
        placeholder="ban@example.com"
        className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Đang gửi…" : "Gửi link đăng nhập"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        Không cần mật khẩu. Link đăng nhập sẽ được gửi qua email.
      </p>
    </form>
  );
}
