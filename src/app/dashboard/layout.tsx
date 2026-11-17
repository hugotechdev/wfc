"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "⊞" },
  { name: "Wanachama", href: "/dashboard/members", icon: "👥" },
  { name: "Michango", href: "/dashboard/contributions", icon: "💰" },
  { name: "Matukio", href: "/dashboard/events", icon: "📅" },
  { name: "Matangazo", href: "/dashboard/announcements", icon: "📢" },
  { name: "Miradi", href: "/dashboard/projects", icon: "🏗️" },
  { name: "Ripoti", href: "/dashboard/reports", icon: "📊" },
  { name: "Mipangilio", href: "/dashboard/settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100 flex flex-col items-center">
            <Image src="/wfc-logo.jpg" alt="WFC Logo" width={80} height={80} className="rounded-full" />
            <p className="mt-2 text-xs text-orange-600 font-semibold text-center">WACHAGGA FAMILY COMMUNITY</p>
            <p className="text-[10px] text-gray-500">Stand up · It's not over</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 text-sm">
              <span>🚪</span> Toka nje
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Admin / Mwenyekiti</p>
              <p className="text-xs text-gray-500">WFC-ADMIN</p>
            </div>
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
