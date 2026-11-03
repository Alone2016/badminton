# Cầu lông: ghi chép buổi đánh theo tuần

Web cho nhóm cầu lông ghi lại các buổi đánh và xem tổng kết theo tuần.

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, đăng nhập bằng link email (không mật khẩu), Row Level Security
- Deploy: Vercel

## Mời thành viên vào nhóm

Chỉ email có trong bảng `members` mới đăng nhập và xem được dữ liệu. Người quản trị làm 2 bước:

**1. Thêm email vào danh sách.** Supabase Dashboard → project → **Table Editor** → bảng `members` → **Insert** → **Insert row**: điền `name` (tên hiện trong web) và `email` (viết thường) → **Save**.

Thêm nhiều người một lúc: **SQL Editor** → dán, sửa tên/email rồi bấm **Run**:

```sql
insert into public.members (name, email) values
  ('Minh', 'minh@gmail.com'),
  ('Lan', 'lan@gmail.com');
```

**2. Gửi tin mời** (Zalo/Messenger), ví dụ:

> Nhóm mình ghi buổi cầu lông ở đây: <link web>
> Mở link, nhập email của bạn, bấm **Gửi link đăng nhập**, rồi mở email **Đăng nhập Cầu lông** và bấm nút **Đăng nhập**. Mỗi máy chỉ cần làm 1 lần.
> Trên điện thoại nên thêm vào màn hình chính để mở nhanh: Safari → nút Chia sẻ → **Thêm vào MH chính**; Chrome → menu ⋮ → **Thêm vào màn hình chính**.

Nếu thành viên báo lỗi:

- "Email này chưa có trong nhóm": email gõ vào khác email đã thêm. Kiểm tra lại bảng `members`.
- Không thấy email: xem mục Spam / Quảng cáo. Link dùng 1 lần và hết hạn sau 1 giờ; hết hạn thì gửi lại (mỗi email cách nhau ít nhất 60 giây).

**Bỏ một người khỏi nhóm:** xóa dòng của họ trong `members`, họ mất quyền xem ngay. Nếu họ đã có tên trong buổi đánh nào, Supabase sẽ không cho xóa (để giữ lịch sử). Khi đó sửa `email` của họ thành một địa chỉ khác (vd thêm `.roi-nhom` vào cuối): họ không đăng nhập được nữa, tên vẫn còn trong các buổi cũ.

## Chạy ở máy

Cần Node.js 20 trở lên.

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị, xem "Biến môi trường"
npm run dev
```

Mở http://localhost:3200, nhập email thành viên và bấm **Gửi link đăng nhập**.
Bấm link trong email **trên cùng trình duyệt** vừa nhập email (xem "Đăng nhập bằng link email").

Web chạy ở cổng 3200 (không phải 3000 mặc định) để không đụng các app khác hay dùng cổng 3000.

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

Hàm `save_play_session(...)` lưu buổi đánh + danh sách người chơi trong một giao dịch (thêm mới khi không truyền `p_id`, sửa khi có). Hàm chạy với quyền người gọi nên RLS vẫn áp dụng.

Giờ giấc: `started_at` lưu dạng `timestamptz`; web nhập/hiển thị theo giờ Việt Nam (UTC+7). Một tuần là Thứ 2 00:00 → Chủ nhật 23:59 giờ VN (`src/lib/week.ts`).

### Lệnh database (Supabase CLI)

Các lệnh tự đọc `SUPABASE_ACCESS_TOKEN` và `SUPABASE_DB_PASSWORD` từ `.env.local`.

```bash
npm run db:link -- <project-ref>   # nối thư mục này với project Supabase (làm 1 lần)
npm run db:push                    # áp các migration mới lên database
npm run db:types                   # sinh lại src/lib/database.types.ts
```

`<project-ref>` là đoạn `xxxx` trong `https://xxxx.supabase.co`.

Thêm/bớt thành viên: xem [Mời thành viên vào nhóm](#mời-thành-viên-vào-nhóm).

## Đăng nhập bằng link email

1. Người dùng nhập email ở `/login`. Web kiểm tra email có trong `members` rồi mới nhờ Supabase gửi link.
2. Link trong email trỏ về `/auth/confirm`, web xác nhận và tạo phiên đăng nhập. Route này nhận cả hai kiểu link:
   - `?token_hash=...&type=email`: mẫu email của dự án (`supabase/templates/`, dùng khi đã cấu hình SMTP riêng). Mở trên trình duyệt nào cũng được (vd: app Gmail trên điện thoại).
   - `?code=...`: mẫu email **mặc định** của Supabase. Phải mở link trên **cùng trình duyệt** đã nhập email.
3. `src/proxy.ts` làm mới phiên ở mỗi request và chuyển người chưa đăng nhập về `/login`.

Cấu hình Auth trên Supabase (Authentication → URL Configuration):

- **Site URL**: địa chỉ web chính (domain Vercel)
- **Redirect URLs**: domain Vercel `https://<tên>.vercel.app/**`, cộng `http://localhost:*/**` và `http://127.0.0.1:*/**` để chạy ở máy

> **Giới hạn email của Supabase miễn phí:** dịch vụ email mặc định chỉ gửi tới email của thành viên trong team Supabase của bạn, chỉ 2 email mỗi giờ, và **không cho sửa mẫu email**. Vì vậy web dùng SMTP riêng (Gmail), xem [Deploy](#deploy-vercel).

## Deploy (Vercel)

Web chạy trên Vercel gói Hobby (miễn phí), nối với repo GitHub:

- Push lên nhánh `main` → Vercel tự build và cập nhật link chính sau khoảng 1 phút.
- Push nhánh khác → Vercel tạo bản xem thử (preview) có link riêng, chỉ người có tài khoản Vercel của project xem được.
- Lịch sử deploy và log lỗi: Vercel Dashboard → project → **Deployments**.

**Biến môi trường trên Vercel** (Project → Settings → Environment Variables, áp cho Production và Preview): chỉ hai biến `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Không đưa `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` hay khóa nào khác lên Vercel. Đổi biến xong phải **Redeploy** mới có hiệu lực (biến `NEXT_PUBLIC_*` được gắn vào lúc build).

**Supabase Auth cho domain Vercel**: Site URL và Redirect URLs như mục [Đăng nhập bằng link email](#đăng-nhập-bằng-link-email). Thiếu domain trong Redirect URLs thì link trong email sẽ đưa về Site URL thay vì đăng nhập.

**Email đăng nhập** (Supabase → Authentication → Emails):

- **SMTP Settings**: gửi qua Gmail. Host `smtp.gmail.com`, port `465`, username = địa chỉ Gmail, password = **mật khẩu ứng dụng** 16 ký tự (tạo ở https://myaccount.google.com/apppasswords, cần bật xác minh 2 bước). Gmail miễn phí gửi được khoảng 500 email/ngày. Thu hồi mật khẩu ứng dụng ở cùng trang thì web sẽ không gửi được email nữa.
- **Templates**: dán `supabase/templates/magic_link.html` vào **Magic Link** và `confirmation.html` vào **Confirm signup**. Mẫu này dùng link `token_hash`, mở bằng trình duyệt nào cũng đăng nhập được.

## Cấu trúc code

```
src/
  proxy.ts                 làm mới phiên + chặn trang khi chưa đăng nhập
  lib/auth.ts              getViewer() / requireMember(): người đang đăng nhập + thông tin thành viên
  lib/sessions.ts          đọc buổi đánh theo tuần, một buổi, thành viên, sân gần đây
  lib/week.ts              ngày/tuần theo giờ Việt Nam
  lib/format.ts            định dạng tiền VNĐ, thời lượng
  lib/stats.ts             thống kê tuần (số buổi, tổng giờ, tổng chi phí)
  lib/supabase/            tạo Supabase client (server, proxy), đọc biến môi trường
  lib/database.types.ts    kiểu dữ liệu database (sinh bằng npm run db:types)
  app/login/               trang đăng nhập + server action gửi link
  app/auth/confirm/        xử lý link trong email
  app/page.tsx             danh sách buổi theo tuần (?tuan=YYYY-MM-DD), nút chuyển tuần, thẻ thống kê
  app/buoi/moi/            thêm buổi
  app/buoi/[id]/           sửa / xóa buổi
  app/buoi/actions.ts      server action lưu / xóa buổi
  app/buoi/session-form.tsx  form nhập buổi (dùng chung cho thêm và sửa)
supabase/
  migrations/              cấu trúc bảng + RLS
  templates/               mẫu email đăng nhập
  config.toml              cấu hình Supabase CLI
```

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm test          # unit test (node:test, không cần cài thêm gì)
npm run build
```
