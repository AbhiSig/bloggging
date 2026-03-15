import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Blog AI Platform",
  description: "AI moderated blog platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}