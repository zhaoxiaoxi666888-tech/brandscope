import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "BrandScope｜AI 品牌研究工作台", template: "%s｜BrandScope" },
  description: "将分散的市场信号整理为可执行的品牌洞察与品牌营销简报。",
  icons: { icon: "/favicon.svg" },
  openGraph: { title:"BrandScope｜AI 品牌研究工作台", description:"品牌研究 → 核心洞察 → 品牌营销简报" },
  twitter: { card:"summary", title:"BrandScope｜AI 品牌研究工作台", description:"看见市场，做出选择。" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
