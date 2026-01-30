import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  
  return !error && data?.role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("admin_id");

    if (!adminId || !(await isAdmin(adminId))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: complaints, error } = await supabase
      .from("complaints")
      .select(`
        *,
        user:users(full_name, phone, voter_id)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin fetch complaints error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch complaints" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error("Admin complaints error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin_id, complaint_id, status, priority } = await request.json();

    if (!admin_id || !(await isAdmin(admin_id))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("complaints")
      .update(updateData)
      .eq("id", complaint_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to update complaint" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, complaint: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
