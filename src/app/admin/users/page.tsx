"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { 
  Users as UsersIcon, 
  ShieldCheck, 
  ShieldAlert, 
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MoreVertical
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`/api/admin/users?admin_id=${currentUser?.id}`);
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser?.id) {
      fetchUsers();
    }
  }, [currentUser?.id]);

  const updateRole = async (userId: string, role: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }

    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: currentUser?.id,
          user_id: userId,
          role
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role } : u
        ));
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gradient-saffron">User Management</h2>
          <p className="text-white/60">Manage resident accounts and administrative access.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#111] border border-white/10 rounded-xl focus:outline-none focus:border-[#FF6B00] transition-colors w-64"
            />
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-[#FF6B00]/20 transition-all">
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Resident</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Contact Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Joined</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-[#FF6B00]">
                        {u.full_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{u.full_name}</p>
                        <p className="text-xs text-white/40">{u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Phone size={14} className="text-[#FF6B00]" />
                        {u.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail size={14} className="text-[#FF6B00]" />
                        {u.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      u.role === "admin" ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "bg-white/10 text-white/60"
                    }`}>
                      {u.role === "admin" ? <ShieldCheck size={14} /> : <UsersIcon size={14} />}
                      {u.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      u.is_verified ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                    }`}>
                      {u.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.role === "admin" ? (
                        <button
                          disabled={updatingId === u.id || u.id === currentUser?.id}
                          onClick={() => updateRole(u.id, "user")}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                          title="Demote to User"
                        >
                          <ShieldAlert size={18} />
                        </button>
                      ) : (
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => updateRole(u.id, "admin")}
                          className="p-2 rounded-lg hover:bg-[#FF6B00]/10 text-[#FF6B00] transition-colors disabled:opacity-50"
                          title="Promote to Admin"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
