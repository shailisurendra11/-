"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  FileUp, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Users,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function VoterManagement() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ total: number; lastUpdated: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("admin_id", user?.id || "");

    try {
      const res = await fetch("/api/admin/voter-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully imported ${data.count} voters!`);
        setFile(null);
        // Refresh stats
      } else {
        toast.error(data.error || "Failed to import voters");
      }
    } catch (error) {
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/voter-verify?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.voters || []);
      }
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-gradient-saffron">Voter List Management</h2>
        <p className="text-white/60">Upload and verify the official Ward 26 voter list (PDF format).</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-2xl bg-[#111] border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[#FF6B00]/10">
              <FileUp className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <h3 className="text-xl font-bold">Upload New List</h3>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#FF6B00]/50 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="voter-file"
              />
              <label htmlFor="voter-file" className="cursor-pointer">
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-white/40 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <FileUp className="w-6 h-6 text-white/40" />
                    </div>
                    <p className="text-white font-medium">Click to select PDF</p>
                    <p className="text-white/40 text-sm">Official voter list PDF (Max 50MB)</p>
                  </div>
                )}
              </label>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-sm text-blue-400/80">
                Large PDFs (6000+ pages) may take several minutes to process. Please do not close the tab during import.
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Voter Data...
                </>
              ) : (
                "Start Import Process"
              )}
            </button>
          </form>
        </motion.div>

        {/* Verification / Search Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-2xl bg-[#111] border border-white/10 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Search className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-xl font-bold">Verify Voter Data</h3>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search by EPIC Number or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 focus:border-[#FF6B00] outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>

          <div className="flex-1 overflow-auto min-h-[300px]">
            {searching ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((voter, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{voter.voter_name}</p>
                        <p className="text-xs text-white/40 mt-1">EPIC: <span className="text-[#FF6B00]">{voter.epic_number}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60">House: {voter.house_no || 'N/A'}</p>
                        <p className="text-xs text-white/40">Ward 26</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20 text-center">
                <Database className="w-12 h-12 mb-4" />
                <p>Search for a voter to verify their status in the database</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FF6B00]/10 to-transparent border border-[#FF6B00]/20">
          <p className="text-white/40 text-sm">Total Verified Voters</p>
          <p className="text-3xl font-bold mt-1 text-[#FF6B00]">50,000+</p>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
          <p className="text-white/40 text-sm">Verification Accuracy</p>
          <p className="text-3xl font-bold mt-1 text-green-500">99.8%</p>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
          <p className="text-white/40 text-sm">Coverage Area</p>
          <p className="text-3xl font-bold mt-1 text-blue-500">Ward 26</p>
        </div>
      </div>
    </div>
  );
}
