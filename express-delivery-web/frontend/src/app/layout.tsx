import type { Metadata } from "next";
import "./globals.css";

// 使用 Tailwind 的默认字体系统，避免 Google Fonts 连接问题
// 如果需要 Inter 字体，可以在构建时配置代理或使用本地字体文件

export const metadata: Metadata = {
  title: "快递服务",
  description: "专业的快递代取服务，提供标准、加急、特快三种服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
