"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Edit2, Save, X, Upload, Loader2 } from "lucide-react";

interface SiteContent {
  id: string;
  content: string;
  type: string;
  description: string;
}

interface EditorContextType {
  isEditorMode: boolean;
  toggleEditorMode: () => void;
  content: Record<string, string>;
  updateContent: (id: string, value: string) => void;
  saveContent: (id: string) => Promise<void>;
  isSaving: boolean;
  hasChanges: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/admin/content");
        const data = await res.json();
        if (data.success) {
          const contentMap: Record<string, string> = {};
          data.content.forEach((item: SiteContent) => {
            contentMap[item.id] = item.content;
          });
          setContent(contentMap);
          setOriginalContent(contentMap);
        }
      } catch (error) {
        console.error("Failed to fetch content", error);
      }
    }
    fetchContent();
  }, []);

  const toggleEditorMode = () => {
    if (!isAdmin) return;
    setIsEditorMode(!isEditorMode);
  };

  const updateContent = (id: string, value: string) => {
    setContent(prev => ({ ...prev, [id]: value }));
    setHasChanges(true);
  };

  const saveContent = async (id: string) => {
    if (!isAdmin || !user) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: user.id,
          id,
          content: content[id],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalContent(prev => ({ ...prev, [id]: content[id] }));
        toast.success("Content saved successfully");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to save content");
      console.error(error);
    } finally {
      setIsSaving(false);
      setHasChanges(false);
    }
  };

  return (
    <EditorContext.Provider
      value={{
        isEditorMode,
        toggleEditorMode,
        content,
        updateContent,
        saveContent,
        isSaving,
        hasChanges
      }}
    >
      {children}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
          <button
            onClick={toggleEditorMode}
            className={`p-4 rounded-full shadow-2xl transition-all ${
              isEditorMode 
                ? "bg-red-600 text-white rotate-90" 
                : "bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-white"
            }`}
            title={isEditorMode ? "Exit Editor Mode" : "Enter Editor Mode"}
          >
            {isEditorMode ? <X size={24} /> : <Edit2 size={24} />}
          </button>
        </div>
      )}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}

interface EditableTextProps {
  id: string;
  defaultContent: string;
  className?: string;
  multiline?: boolean;
}

export function EditableText({ id, defaultContent, className = "", multiline = false }: EditableTextProps) {
  const { isEditorMode, content, updateContent, saveContent, isSaving } = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  const currentContent = content[id] || defaultContent;

  const handleBlur = async () => {
    setIsEditing(false);
    if (currentContent !== defaultContent) {
      await saveContent(id);
    }
  };

  if (!isEditorMode) {
    return <span className={className}>{currentContent}</span>;
  }

  return (
    <div className={`relative group ${className}`}>
      {isEditing ? (
        multiline ? (
          <textarea
            className="w-full bg-white/10 border border-[#FF6B00] rounded px-2 py-1 text-white focus:outline-none"
            value={currentContent}
            onChange={(e) => updateContent(id, e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <input
            className="w-full bg-white/10 border border-[#FF6B00] rounded px-2 py-1 text-white focus:outline-none"
            value={currentContent}
            onChange={(e) => updateContent(id, e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        )
      ) : (
        <div 
          className="cursor-pointer border border-dashed border-white/20 hover:border-[#FF6B00] p-1 rounded transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {currentContent}
          <Edit2 size={12} className="inline-block ml-2 opacity-50 group-hover:opacity-100" />
        </div>
      )}
      {isSaving && (
        <div className="absolute -top-6 right-0">
          <Loader2 size={12} className="animate-spin text-[#FF6B00]" />
        </div>
      )}
    </div>
  );
}

interface EditableImageProps {
  id: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?: string;
}

export function EditableImage({ 
  id, 
  defaultSrc, 
  alt, 
  className = "", 
  style, 
  objectFit = "cover",
  objectPosition = "center" 
}: EditableImageProps) {
  const { isEditorMode, content, updateContent, saveContent, isSaving } = useEditor();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const currentSrc = content[id] || defaultSrc;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("admin_id", user.id);

    try {
      const res = await fetch("/api/admin/content/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        updateContent(id, data.url);
        await saveContent(id);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative group ${className}`} style={style}>
      <img 
        src={currentSrc} 
        alt={alt} 
        className="w-full h-full" 
        style={{ objectFit, objectPosition }} 
      />
      
      {isEditorMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <label className="cursor-pointer bg-[#FF6B00] text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#FF6B00]/80 transition-colors">
            {isUploading || isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            {isUploading ? "Uploading..." : "Change Image"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || isSaving}
            />
          </label>
        </div>
      )}
    </div>
  );
}
