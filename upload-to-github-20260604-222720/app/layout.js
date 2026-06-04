import "./globals.css";

export const metadata = {
  title: "宝宝状态同步",
  description: "一个温柔的情侣状态同步页面"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
