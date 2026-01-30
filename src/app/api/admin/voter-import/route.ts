import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use a safer way to import pdf-parse in Next.js ESM
let pdf: any;
try {
  const pdfModule = require("pdf-parse");
  pdf = typeof pdfModule === "function" ? pdfModule : pdfModule.default;
  if (!pdf) {
    // Fallback for some environments
    pdf = require("pdf-parse/lib/pdf-parse.js");
  }
} catch (e) {
  pdf = require("pdf-parse/lib/pdf-parse.js");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Allowed Admin Numbers
const ADMIN_NUMBERS = ["+919152233535", "9833311392"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const adminId = formData.get("admin_id") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Verify Admin
    const { data: adminUser, error: authError } = await supabase
      .from("users")
      .select("phone, role")
      .eq("id", adminId)
      .single();

    if (authError || !adminUser) {
      console.error("Auth error:", authError);
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const cleanPhone = adminUser?.phone?.replace(/[^0-9+]/g, "");
    const isAdmin = cleanPhone && (ADMIN_NUMBERS.includes(cleanPhone) || adminUser.role === "admin");

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF
    let pdfData;
    try {
      // Use a more standard way to call pdf-parse
      pdfData = await pdf(buffer);
    } catch (parseError: any) {
      console.error("PDF Parse Error:", parseError);
      return NextResponse.json({ success: false, error: "Failed to parse PDF: " + parseError.message }, { status: 400 });
    }

    const text = pdfData.text;
    
      // Improved Regex for Marathi/English voter lists
      // EPIC format can be 3 letters + 7 digits OR 10 characters OR with slashes
      const epicRegex = /[A-Z]{3}[0-9]{7}|[A-Z]{3}\/[0-9]{2}\/[0-9]{3}\/[0-9]{7}/g;
      const votersMap = new Map();
      
      // Find all EPIC numbers first
      const epics = text.match(epicRegex) || [];
      console.log(`Found ${epics.length} potential EPIC numbers`);

      // Split text into chunks that likely represent individual voter cards
      // Usually, cards are separated by some pattern or EPIC number
      const voterChunks = text.split(/(?=निर्वाचक नोंदणी अधिकारी|EPIC|नाव|नांव|Name|वडीलांचे)/g);
      
      let currentEpic = "";
      
      for (const chunk of voterChunks) {
        const epicMatch = chunk.match(/[A-Z]{3}[0-9]{7}|[A-Z]{3}\/[0-9]{2}\/[0-9]{3}\/[0-9]{7}/);
        if (epicMatch) {
          currentEpic = epicMatch[0];
        }

        if (!currentEpic) continue;

        let voterName = "";
        let fatherName = "";
        let houseNo = "";
        let age = null;
        let gender = "";

        // Marathi Keywords with more variations
        // नाव / Name - looking for the line starting with नाव/नांव
        const nameMatch = chunk.match(/(?:नाव|नांव|Name)\s*[:：]\s*([^\n\r]+)/);
        if (nameMatch) {
          voterName = nameMatch[1].trim().split(/\s{2,}/)[0].replace(/[\r\n]/g, " ");
        }

        // वडील/पतीचे नाव / Father's/Husband's Name
        const fatherMatch = chunk.match(/(?:वडीलांचे नाव|पतीचे नाव|वडीलांचे नांव|पतीचे नांव|Father's Name|Husband's Name)\s*[:：]\s*([^\n\r]+)/);
        if (fatherMatch) {
          fatherName = fatherMatch[1].trim().split(/\s{2,}/)[0].replace(/[\r\n]/g, " ");
        }

        // घर क्र. / House No
        const houseMatch = chunk.match(/(?:घर क्र\.|घर क्रमांक|House No\.?)\s*[:：]\s*([^\n\r\t ]+)/);
        if (houseMatch) houseNo = houseMatch[1].trim();

        // वय / Age
        const ageMatch = chunk.match(/(?:वय|Age)\s*[:：]\s*(\d+)/);
        if (ageMatch) age = parseInt(ageMatch[1]);

        // लिंग / Gender
        const genderMatch = chunk.match(/(?:लिंग|Gender)\s*[:：]\s*(स्त्री|पुरुष|Female|Male)/);
        if (genderMatch) {
          const g = genderMatch[1].trim();
          gender = (g === "स्त्री" || g === "Female") ? "Female" : "Male";
        }

        if (voterName && voterName.length > 2 && currentEpic) {
          // Avoid noise (like column headers)
          if (voterName.includes("नोंदणी") || voterName.includes("अधिकारी")) continue;
          
          votersMap.set(currentEpic, {
            epic_number: currentEpic,
            voter_name: voterName,
            father_husband_name: fatherName || "",
            house_no: houseNo || "",
            age: age,
            gender: gender,
            ward_number: "26"
          });
        }
      }


    const voters = Array.from(votersMap.values());

    if (voters.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No voter data found. Please ensure the PDF is a text-based voter list." 
      }, { status: 400 });
    }

    // Batch upsert
    const batchSize = 500;
    let totalImported = 0;

    for (let i = 0; i < voters.length; i += batchSize) {
      const batch = voters.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("voter_list")
        .upsert(batch, { onConflict: "epic_number" });
      
      if (!insertError) {
        totalImported += batch.length;
      } else {
        console.error("Batch insert error:", insertError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: totalImported,
      total_found: voters.length
    });

  } catch (error: any) {
    console.error("Voter import error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal server error during processing" 
    }, { status: 500 });
  }
}
