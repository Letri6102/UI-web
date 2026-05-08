import "./globals.css";

export const metadata = {
  title: "Trung tâm giám sát kho",
  description: "Giao diện vận hành camera kho cho người trực ca, xác minh cảnh báo và lưu bằng chứng.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#06101a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-neutral-950 text-white">{children}</body>
    </html>
  );
}
