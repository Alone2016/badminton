# Cầu lông: ghi chép buổi đánh theo tuần

Web cho nhóm cầu lông ghi lại các buổi đánh và xem tổng kết theo tuần.

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, đăng nhập bằng link email (không mật khẩu), Row Level Security
- Deploy: Vercel

## Chạy ở máy

Cần Node.js 20 trở lên.

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị, xem "Biến môi trường"
npm run dev
```

Mở http://localhost:3000, nhập email thành viên và bấm **Gửi link đăng nhập**.

### Biến môi trường

Điền trong `.env.local`. File này đã nằm trong `.gitignore`, **không commit**.

| Biến | Lấy ở đâu | Dùng cho |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API Keys (hoặc nút **Connect**) | Web |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cùng chỗ: **Publishable key** (`sb_publishable_...`) hoặc anon key | Web |
| `SUPABASE_ACCESS_TOKEN` | Dashboard → Account → Access Tokens | Supabase CLI (chỉ ở máy) |
| `SUPABASE_DB_PASSWORD` | Mật khẩu database đặt lúc tạo project | Supabase CLI (chỉ ở máy) |

Hai biến `NEXT_PUBLIC_*` là khóa công khai, an toàn khi lộ ra trình duyệt vì dữ liệu đã được bảo vệ bằng RLS.
**Không bao giờ** dùng `service_role` / secret key trong code web.

## Database

Toàn bộ cấu trúc bảng và phân quyền nằm trong `supabase/migrations/`. Không sửa bảng bằng tay trên Dashboard; muốn đổi thì thêm file migration mới.

| Bảng | Nội dung |
|---|---|
| `members` | Thành viên nhóm: tên, email. **Chỉ email có trong bảng này mới đăng nhập và xem được dữ liệu.** |
| `play_sessions` | Buổi đánh: bắt đầu lúc (`started_at`), thời lượng phút, sân, chi phí VNĐ, người tạo (tự gán) |
| `play_session_players` | Người chơi trong buổi: một thành viên (`member_id`) hoặc tên khách (`guest_name`) |

Phân quyền (RLS):

- Chưa đăng nhập: không đọc/ghi được gì.
- Đã đăng nhập nhưng email không có trong `members`: không đọc/ghi được gì, web báo "Bạn chưa có trong nhóm".
- Thành viên: xem danh sách thành viên; xem/thêm/sửa/xóa buổi đánh và người chơi.
- Thêm/sửa/xóa thành viên: quản trị làm trên Supabase Dashboard.

### Lệnh database (Supabase CLI)

Các lệnh tự đọc `SUPABASE_ACCESS_TOKEN` và `SUPABASE_DB_PASSWORD` từ `.env.local`.

```bash
npm run db:link -- <project-ref>   # nối thư mục này với project Supabase (làm 1 lần)
npm run db:push                    # áp các migration mới lên database
npm run db:types                   # sinh lại src/lib/database.types.ts
```

`<project-ref>` là đoạn `xxxx` trong `https://xxxx.supabase.co`.

### Thêm thành viên

Supabase Dashboard → **Table Editor** → bảng `members` → **Insert row**: điền `name` và `email` (viết thường). Hoặc chạy trong **SQL Editor**:

```sql
insert into public.members (name, email) values ('Tên', 'email@example.com');
```

Thành viên mới chỉ cần mở web, nhập email là nhận được link đăng nhập.

## Đăng nhập bằng link email

1. Người dùng nhập email ở `/login`. Web kiểm tra email có trong `members` rồi mới nhờ Supabase gửi link.
2. Link trong email trỏ về `/auth/confirm?token_hash=...`, web xác nhận và tạo phiên đăng nhập.
3. `src/proxy.ts` làm mới phiên ở mỗi request và chuyển người chưa đăng nhập về `/login`.

Mẫu email nằm ở `supabase/templates/`. Cấu hình Auth trên Supabase cần có:

- **Site URL**: địa chỉ web chính (vd: `http://localhost:3000`, sau này là domain Vercel)
- **Redirect URLs**: `http://localhost:3000/**` và domain Vercel `https://<tên>.vercel.app/**`
- Mẫu email **Magic Link** và **Confirm signup** dùng nội dung trong `supabase/templates/`

> **Giới hạn email của Supabase miễn phí:** dịch vụ email mặc định chỉ gửi tới email của thành viên trong team Supabase của bạn và chỉ vài email mỗi giờ. Để cả nhóm đăng nhập được cần cấu hình SMTP riêng (vd: Resend, Brevo đều có gói miễn phí) ở Authentication → Emails → SMTP Settings.

## Cấu trúc code

```
src/
  proxy.ts                 làm mới phiên + chặn trang khi chưa đăng nhập
  lib/auth.ts              getViewer(): người đang đăng nhập + thông tin thành viên
  lib/supabase/            tạo Supabase client (server, proxy), đọc biến môi trường
  lib/database.types.ts    kiểu dữ liệu database (sinh bằng npm run db:types)
  app/login/               trang đăng nhập + server action gửi link
  app/auth/confirm/        xử lý link trong email
  app/page.tsx             trang chủ (sau khi đăng nhập)
supabase/
  migrations/              cấu trúc bảng + RLS
  templates/               mẫu email đăng nhập
  config.toml              cấu hình Supabase CLI
```

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
```
