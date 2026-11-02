-- Khởi tạo dữ liệu cho web ghi chép cầu lông.
--
-- Bảng:
--   members               thành viên nhóm (cũng là danh sách email được phép đăng nhập)
--   play_sessions         buổi đánh
--   play_session_players  người chơi trong buổi (thành viên hoặc khách)
--
-- Phân quyền (Row Level Security):
--   - Người chưa đăng nhập (anon): không đọc/ghi được gì.
--   - Người đã đăng nhập nhưng email không có trong members: không đọc/ghi được gì.
--   - Thành viên: xem danh sách thành viên; xem/thêm/sửa/xóa buổi đánh và người chơi.
--   - Thêm/sửa/xóa thành viên: chỉ quản trị làm trong Supabase Dashboard (bỏ qua RLS).

-- ---------------------------------------------------------------------------
-- Bảng
-- ---------------------------------------------------------------------------

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  -- Lưu chữ thường, không khoảng trắng thừa để so khớp với email đăng nhập.
  email text not null unique check (email = lower(btrim(email)) and email like '%_@_%'),
  created_at timestamptz not null default now()
);

comment on table public.members is
  'Thành viên nhóm. Chỉ email có trong bảng này mới đăng nhập và xem được dữ liệu.';

create table public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  court text not null check (char_length(btrim(court)) between 1 and 120),
  cost_vnd bigint not null default 0 check (cost_vnd >= 0),
  -- Người tạo: tự gán theo người đăng nhập (trigger bên dưới), không sửa được.
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.play_sessions is 'Buổi đánh cầu lông.';

create index play_sessions_started_at_idx on public.play_sessions (started_at);
create index play_sessions_created_by_idx on public.play_sessions (created_by);

create table public.play_session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  -- Mỗi dòng là MỘT trong hai: thành viên nhóm (member_id) hoặc khách (guest_name).
  member_id uuid references public.members (id) on delete restrict,
  guest_name text check (guest_name is null or char_length(btrim(guest_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  constraint play_session_players_member_or_guest check (num_nonnulls(member_id, guest_name) = 1),
  constraint play_session_players_unique_member unique (session_id, member_id)
);

comment on table public.play_session_players is
  'Người chơi trong buổi: chọn từ thành viên nhóm hoặc gõ tên khách.';

create index play_session_players_member_id_idx on public.play_session_players (member_id);

-- ---------------------------------------------------------------------------
-- Hàm hỗ trợ phân quyền
-- ---------------------------------------------------------------------------

-- id thành viên của người đang đăng nhập (null nếu không phải thành viên).
-- Dùng email đã xác nhận trong auth.users để so với members.email.
create function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.members m
  join auth.users u on lower(u.email) = m.email
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
$$;

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_member_id() is not null
$$;

-- Trang đăng nhập gọi hàm này trước khi gửi link, để không gửi email cho người ngoài nhóm.
create function public.can_sign_in(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members where email = lower(btrim(p_email))
  )
$$;

-- Tự gán người tạo khi thêm buổi, giữ nguyên khi sửa.
create function public.play_sessions_set_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := public.current_member_id();
  else
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

create trigger play_sessions_set_created_by
  before insert or update on public.play_sessions
  for each row execute function public.play_sessions_set_created_by();

revoke execute on function public.current_member_id() from public, anon;
revoke execute on function public.is_member() from public, anon;
revoke execute on function public.can_sign_in(text) from public;
revoke execute on function public.play_sessions_set_created_by() from public, anon, authenticated;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.is_member() to authenticated;
grant execute on function public.can_sign_in(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Quyền bảng + Row Level Security
-- ---------------------------------------------------------------------------

revoke all on public.members, public.play_sessions, public.play_session_players from anon, authenticated;
grant select on public.members to authenticated;
grant select, insert, update, delete on public.play_sessions, public.play_session_players to authenticated;

alter table public.members enable row level security;
alter table public.play_sessions enable row level security;
alter table public.play_session_players enable row level security;

-- members: thành viên chỉ được xem (thêm/sửa trong Dashboard).
create policy "Thành viên xem danh sách thành viên"
  on public.members for select to authenticated
  using ((select public.is_member()));

-- play_sessions
create policy "Thành viên xem buổi đánh"
  on public.play_sessions for select to authenticated
  using ((select public.is_member()));

create policy "Thành viên thêm buổi đánh"
  on public.play_sessions for insert to authenticated
  with check ((select public.is_member()));

create policy "Thành viên sửa buổi đánh"
  on public.play_sessions for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Thành viên xóa buổi đánh"
  on public.play_sessions for delete to authenticated
  using ((select public.is_member()));

-- play_session_players
create policy "Thành viên xem người chơi"
  on public.play_session_players for select to authenticated
  using ((select public.is_member()));

create policy "Thành viên thêm người chơi"
  on public.play_session_players for insert to authenticated
  with check ((select public.is_member()));

create policy "Thành viên sửa người chơi"
  on public.play_session_players for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Thành viên xóa người chơi"
  on public.play_session_players for delete to authenticated
  using ((select public.is_member()));
