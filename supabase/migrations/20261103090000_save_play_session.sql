-- Lưu một buổi đánh cùng danh sách người chơi trong MỘT giao dịch,
-- để không bao giờ có buổi bị thiếu người chơi khi lỗi giữa chừng.
--
-- Không truyền p_id (null) -> thêm buổi mới
-- Có p_id                 -> sửa buổi đó và thay toàn bộ danh sách người chơi
--
-- Chạy với quyền của người gọi (security invoker) nên RLS vẫn áp dụng như
-- thường; trigger play_sessions_set_created_by vẫn tự gán người tạo.

create function public.save_play_session(
  p_started_at timestamptz,
  p_duration_minutes integer,
  p_court text,
  p_cost_vnd bigint,
  p_member_ids uuid[],
  p_guest_names text[],
  p_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_member() then
    raise exception 'not a member' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.play_sessions (started_at, duration_minutes, court, cost_vnd)
    values (p_started_at, p_duration_minutes, btrim(p_court), p_cost_vnd)
    returning id into v_id;
  else
    update public.play_sessions
    set started_at = p_started_at,
        duration_minutes = p_duration_minutes,
        court = btrim(p_court),
        cost_vnd = p_cost_vnd
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'play session not found' using errcode = 'P0002';
    end if;

    delete from public.play_session_players where session_id = v_id;
  end if;

  insert into public.play_session_players (session_id, member_id)
  select distinct v_id, m
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) as m
  where m is not null;

  insert into public.play_session_players (session_id, guest_name)
  select v_id, g
  from (
    select distinct btrim(x) as g
    from unnest(coalesce(p_guest_names, '{}'::text[])) as x
  ) as guests
  where g is not null and g <> '';

  return v_id;
end;
$$;

revoke execute on function public.save_play_session(timestamptz, integer, text, bigint, uuid[], text[], uuid)
  from public, anon;
grant execute on function public.save_play_session(timestamptz, integer, text, bigint, uuid[], text[], uuid)
  to authenticated;
