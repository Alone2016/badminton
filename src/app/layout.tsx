import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cầu lông",
  description: "Ghi lại các buổi đánh cầu lông của nhóm và xem tổng kết theo tuần.",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
