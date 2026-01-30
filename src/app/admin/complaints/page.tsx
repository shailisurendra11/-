"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Filter,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function AdminComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const res = await fetch(`/api/admin/complaints?admin_id=${user?.id}`);
        const data = await res.json();
        if (data.success) {
          setComplaints(data.complaints);
        }
      } catch (error) {
        console.error("Failed to fetch complaints:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchComplaints();
    }
  }, [user?.id]);

  const updateStatus = async (complaintId: string, status: string) => {
    setUpdatingId(complaintId);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: user?.id,
          complaint_id: complaintId,
          status
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(complaints.map(c => 
          c.id === complaintId ? { ...c, status } : c
        ));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch = 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
          <h2 className="text-3xl font-bold mb-2 text-gradient-saffron">Complaints Management</h2>
          <p className="text-white/60">Review and resolve resident issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#111] border border-white/10 rounded-xl focus:outline-none focus:border-[#FF6B00] transition-colors w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-white/10">
            <p className="text-white/40">No complaints found matching your criteria.</p>
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <motion.div
              key={complaint.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            complaint.priority === "high" ? "bg-red-500/20 text-red-500" :
                            complaint.priority === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-blue-500/20 text-blue-500"
                          }`}>
                            {complaint.priority} Priority
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-xs text-white/40">{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{complaint.title}</h3>
                        <p className="text-white/60 mt-1">{complaint.description}</p>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        complaint.status === "resolved" ? "bg-green-500/20 text-green-500" :
                        complaint.status === "in-progress" ? "bg-blue-500/20 text-blue-500" :
                        "bg-orange-500/20 text-orange-500"
                      }`}>
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <MapPin className="w-4 h-4 text-[#FF6B00]" />
                          {complaint.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Phone className="w-4 h-4 text-[#FF6B00]" />
                          {complaint.user?.full_name} ({complaint.user?.phone})
                        </div>
                      </div>
                      <div className="flex items-end justify-end gap-3">
                        <button
                          disabled={updatingId === complaint.id}
                          onClick={() => updateStatus(complaint.id, "in-progress")}
                          className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          Mark In Progress
                        </button>
                        <button
                          disabled={updatingId === complaint.id}
                          onClick={() => updateStatus(complaint.id, "resolved")}
                          className="px-4 py-2 rounded-xl bg-green-500/10 text-green-500 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  {complaint.image_url && (
                    <div className="lg:w-48 lg:h-48 relative rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                      <Image
                        src={complaint.image_url}
                        alt="Complaint proof"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <a
                        href={complaint.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <ExternalLink className="w-6 h-6 text-white" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
