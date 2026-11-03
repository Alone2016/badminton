"use client";

import {
  useActionState,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { formatDurationShort, formatNumber } from "@/lib/format";
import type { MemberOption } from "@/lib/sessions";
import { saveSession, type SessionFormState } from "./actions";

export type SessionFormValues = {
  date: string;
  time: string;
  durationMinutes: number;
  court: string;
  costVnd: number;
  memberIds: string[];
  guestNames: string[];
};

const DURATION_CHOICES = [60, 90, 120, 150, 180];
const initialState: SessionFormState = {};

const inputClass =
  "block h-12 w-full min-w-0 appearance-none rounded-xl border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-invalid:border-red-500";

function chipClass(selected: boolean) {
  return `inline-flex h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium transition-colors ${
    selected
      ? "border-emerald-600 bg-emerald-600 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
  }`;
}

/** Chỉ giữ chữ số rồi thêm dấu chấm ngăn cách: "150000" -> "150.000". */
function formatCostInput(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10);
  return digits === "" ? "" : formatNumber(Number(digits));
}

export function SessionForm({
  sessionId,
  initial,
  members,
  recentCourts,
}: {
  sessionId?: string;
  initial: SessionFormValues;
  members: MemberOption[];
  recentCourts: string[];
}) {
  const [state, formAction, pending] = useActionState(
    saveSession,
    initialState,
  );

  // Mọi ô đều do state giữ, để giá trị không mất khi server báo lỗi.
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(String(initial.durationMinutes));
  const [court, setCourt] = useState(initial.court);
  const [cost, setCost] = useState(
    initial.costVnd > 0 ? formatNumber(initial.costVnd) : "",
  );
  const [memberIds, setMemberIds] = useState(initial.memberIds);
  const [guests, setGuests] = useState(initial.guestNames);
  const [guestDraft, setGuestDraft] = useState("");

  const errors = state.errors ?? {};

  function toggleMember(id: string) {
    setMemberIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function addGuest() {
    const name = guestDraft.trim();
    if (name && !guests.includes(name)) setGuests([...guests, name]);
    setGuestDraft("");
  }

  function onGuestKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Enter trong ô tên khách = thêm khách, không gửi form.
    if (e.key === "Enter") {
      e.preventDefault();
      addGuest();
    }
  }

  // Tên khách gõ dở mà chưa bấm "Thêm" vẫn được lưu.
  const pendingGuest = guestDraft.trim();
  const guestsToSubmit =
    pendingGuest && !guests.includes(pendingGuest)
      ? [...guests, pendingGuest]
      : guests;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {sessionId && <input type="hidden" name="id" value={sessionId} />}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày" htmlFor="date" error={errors.date}>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
            className={inputClass}
          />
        </Field>
        <Field label="Giờ bắt đầu" htmlFor="time" error={errors.time}>
          <input
            id="time"
            name="time"
            type="time"
            required
            step={300}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={!!errors.time}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Thời lượng" htmlFor="duration" error={errors.duration}>
        <div className="flex flex-wrap gap-2">
          {DURATION_CHOICES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={duration === String(m)}
              onClick={() => setDuration(String(m))}
              className={chipClass(duration === String(m))}
            >
              {formatDurationShort(m)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="duration"
            name="duration"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-invalid={!!errors.duration}
            className={`${inputClass} max-w-28`}
          />
          <span className="text-sm text-zinc-500">phút</span>
        </div>
      </Field>

      <Field label="Sân" htmlFor="court" error={errors.court}>
        <input
          id="court"
          name="court"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="Ví dụ: Sân Hoa Lư"
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          aria-invalid={!!errors.court}
          className={inputClass}
        />
        {recentCourts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {recentCourts.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={court === c}
                onClick={() => setCourt(c)}
                className={chipClass(court === c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium">
          Người chơi
        </legend>
        {members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const selected = memberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleMember(m.id)}
                  className={chipClass(selected)}
                >
                  {selected && <span aria-hidden>✓</span>}
                  {m.name}
                </button>
              );
            })}
          </div>
        )}
        {memberIds.map((id) => (
          <input key={id} type="hidden" name="member_id" value={id} />
        ))}

        {guests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {guests.map((g) => (
              <li
                key={g}
                className="inline-flex h-11 items-center gap-1 rounded-full border border-dashed border-zinc-400 bg-zinc-50 pl-4 pr-1 text-sm"
              >
                <span>
                  {g} <span className="text-zinc-500">(khách)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(guests.filter((x) => x !== g))}
                  aria-label={`Bỏ khách ${g}`}
                  className="grid size-9 place-items-center rounded-full text-lg text-zinc-500 hover:bg-zinc-200"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {guestsToSubmit.map((g) => (
          <input key={g} type="hidden" name="guest_name" value={g} />
        ))}

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            aria-label="Tên khách"
            placeholder="Thêm khách (gõ tên)"
            maxLength={80}
            autoComplete="off"
            enterKeyHint="done"
            value={guestDraft}
            onChange={(e) => setGuestDraft(e.target.value)}
            onKeyDown={onGuestKeyDown}
            className={inputClass}
          />
          <button
            type="button"
            onClick={addGuest}
            disabled={pendingGuest === ""}
            className="h-12 shrink-0 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
        {errors.players && <FieldError message={errors.players} />}
      </fieldset>

      <Field label="Chi phí" htmlFor="cost" error={errors.cost}>
        <div className="relative">
          <input
            id="cost"
            name="cost"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={cost}
            onChange={(e) => setCost(formatCostInput(e.target.value))}
            aria-invalid={!!errors.cost}
            className={`${inputClass} pr-10 tabular-nums`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-zinc-500">
            ₫
          </span>
        </div>
      </Field>

      {/* Nút lưu luôn nằm ở đáy màn hình điện thoại. */}
      <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-zinc-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        {state.message && (
          <p role="alert" className="mb-2 text-sm text-red-600">
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : sessionId ? "Lưu thay đổi" : "Lưu buổi"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
