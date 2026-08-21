import type { ReactNode } from "react";

export const metadata = {
  title: "Kiln + Next.js Standalone Demo",
  description: "Compiled into a native Bun binary using kiln-compiler",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        {children}
      </body>
    </html>
  );
}
