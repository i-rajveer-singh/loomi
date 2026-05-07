"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const linkBase =
    "px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-out tracking-tight";

  const isChatActive = pathname === "/chat";
  const chatClass = isChatActive
    ? "bg-gray-900 text-white shadow-sm"
    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";

  const isCanvasActive = pathname === "/canvas";
  const canvasClass = isCanvasActive
    ? "bg-gray-900 text-white shadow-sm"
    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center p-1 bg-white/70 backdrop-blur-md border border-gray-200 rounded-full shadow-sm">
      <Link href="/chat" className={`${linkBase} ${chatClass}`}>
        chat
      </Link>
      <Link href="/canvas" className={`${linkBase} ${canvasClass}`}>
        mind canvas
      </Link>
    </div>
  );
}
