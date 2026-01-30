"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Users as UsersIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [complaintsRes, usersRes] = await Promise.all([
          fetch(`/api/admin/complaints?admin_id=${user?.id}`),
          fetch(`/api/admin/users?admin_id=${user?.id}`)
        ]);

        const complaintsData = await complaintsRes.json();
        const usersData = await usersRes.json();

        if (complaintsData.success && usersData.success) {
          const complaints = complaintsData.complaints;
          setStats({
            totalComplaints: complaints.length,
            pendingComplaints: complaints.filter((c: any) => c.status === "pending").length,
            resolvedComplaints: complaints.filter((c: any) => c.status === "resolved").length,
            totalUsers: usersData.users.length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const cards = [
    {
      title: "Total Complaints",
      value: stats.totalComplaints,
      icon: MessageSquare,
      color: "blue",
      description: "Across all categories"
    },
    {
      title: "Pending Resolve",
      value: stats.pendingComplaints,
      icon: Clock,
      color: "orange",
      description: "Action required"
    },
    {
      title: "Resolved",
      value: stats.resolvedComplaints,
      icon: CheckCircle2,
      color: "green",
      description: "Successfully addressed"
    },
    {
      title: "Total Residents",
      value: stats.totalUsers,
      icon: UsersIcon,
      color: "purple",
      description: "Registered in Ward 26"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-gradient-saffron">Dashboard Overview</h2>
        <p className="text-white/60">Welcome back, {user?.full_name}. Here's what's happening in Ward 26.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-2xl bg-[#111] border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
                <card.icon className={`w-6 h-6 text-[#FF6B00]`} />
              </div>
              <TrendingUp className="w-4 h-4 text-white/20" />
            </div>
            <h3 className="text-white/60 text-sm font-medium">{card.title}</h3>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <p className="text-xs text-white/40 mt-2">{card.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#111] border border-white/10">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4 text-white/60 text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Activity logs will appear here once new actions are taken.</p>
          </div>
        </div>
        
        <div className="p-8 rounded-2xl bg-[#111] border border-white/10">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-4 rounded-xl bg-[#FF6B00] text-white font-semibold hover:bg-[#FF8533] transition-colors text-left flex items-center justify-between group">
              Post Announcement
              <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
            <button className="w-full p-4 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors text-left">
              Update Voter List
            </button>
            <button className="w-full p-4 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors text-left">
              Generate Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
