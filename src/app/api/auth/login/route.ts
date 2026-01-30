import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
      const { phone, password } = await request.json();

      if (!phone || !password) {
        return NextResponse.json(
          { success: false, error: "Phone number and password are required" },
          { status: 400 }
        );
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number or password" },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number or password" },
          { status: 401 }
        );
      }


    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
