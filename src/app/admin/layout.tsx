"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { BJPLogo } from "@/components/BJPLogo";
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Home } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/10 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <BJPLogo size="sm" />
          <span className="font-bold text-lg text-[#FF6B00]">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link
            href="/admin/complaints"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
          >
            <MessageSquare size={20} />
            Complaints
          </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            >
              <Users size={20} />
              Users / Admins
            </Link>
            <Link
              href="/admin/voters"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            >
              <LayoutDashboard size={20} className="text-green-500" />
              Voter List
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            >
            <Settings size={20} />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white text-sm"
          >
            <Home size={18} />
            Back to Site
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-500 text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl flex items-center justify-between px-8 lg:px-12 sticky top-0 z-10">
          <h1 className="text-xl font-semibold">Ward 26 Administration</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-white/50">{user.phone}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#D4AF37] flex items-center justify-center font-bold">
              {user.full_name[0]}
            </div>
          </div>
        </header>
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
