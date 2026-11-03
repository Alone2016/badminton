"use client";

import { useActionState, useState } from "react";
import { deleteSession, type DeleteSessionState } from "./actions";

const initialState: DeleteSessionState = {};

// Xóa có hai bước: bấm "Xóa buổi này" -> hiện hỏi xác nhận -> bấm "Xóa".
export function DeleteSession({
  sessionId,
  week,
}: {
  sessionId: string;
  week: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteSession,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 font-medium text-red-600 hover:bg-red-50"
      >
        Xóa buổi này
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-red-200 bg-red-50 p-4"
      role="alertdialog"
      aria-labelledby="delete-title"
    >
      <input type="hidden" name="id" value={sessionId} />
      <input type="hidden" name="week" value={week} />
      <p id="delete-title" className="font-semibold text-red-700">
        Xóa buổi này?
      </p>
      <p className="mt-1 text-sm text-zinc-700">
        Buổi đánh và danh sách người chơi sẽ bị xóa hẳn, không khôi phục được.
      </p>
      {state.message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.message}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-12 rounded-xl border border-zinc-300 bg-white font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Đang xóa…" : "Xóa"}
        </button>
      </div>
    </form>
  );
}
