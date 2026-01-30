import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(userId: string) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  
  return !error && data?.role === "admin";
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("*");

    if (error) throw error;

    return NextResponse.json({ success: true, content: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin_id, id, content, type, description } = await request.json();

    if (!admin_id || !(await isAdmin(admin_id))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("site_content")
      .upsert({
        id,
        content,
        type,
        description,
        updated_at: new Date().toISOString(),
        updated_by: admin_id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, content: data });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}
