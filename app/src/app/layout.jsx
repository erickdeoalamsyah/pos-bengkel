// src/app/layout.jsx
import TopLoader from "@/components/TopLoader";
import "./globals.css";
import AuthBootstrap from "@/components/AuthBootstrap";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-black text-white">
        <AuthBootstrap />
        <TopLoader/>
        {children}
      </body>
    </html>
  );
}
