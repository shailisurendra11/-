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

interface VoterEntry {
  epic_number: string;
  voter_name: string;
  father_husband_name?: string;
  house_no?: string;
  age?: number;
  gender?: string;
  ward_number: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pdfUrl = formData.get("pdf_url") as string | null;

    let pdfBuffer: Buffer;

    if (file) {
      pdfBuffer = Buffer.from(await file.arrayBuffer());
    } else if (pdfUrl) {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      return NextResponse.json({ success: false, error: "No PDF provided" }, { status: 400 });
    }

    // Parse PDF
    let pdfData;
    try {
      pdfData = await pdf(pdfBuffer);
    } catch (parseError: any) {
      console.error("PDF Parse Error:", parseError);
      return NextResponse.json({ success: false, error: "Failed to parse PDF: " + parseError.message }, { status: 400 });
    }

    const text = pdfData.text;
    const epicRegex = /[A-Z]{3}[0-9]{7}/g;
    const votersMap = new Map<string, VoterEntry>();
    
    const epics = text.match(epicRegex) || [];
    const blocks = text.split(/[A-Z]{3}[0-9]{7}/);
    
    for (let i = 0; i < epics.length; i++) {
      const epic = epics[i];
      const context = (blocks[i] || "").slice(-500) + " " + epic + " " + (blocks[i+1] || "").slice(0, 500);

      let voterName = "";
      let fatherName = "";
      let houseNo = "";
      let age: number | undefined;
      let gender = "";

      const nameMatch = context.match(/(?:नाव|Name)\s*[:：]\s*([^ \n\r\t]+(?: [^ \n\r\t]+)*)/);
      if (nameMatch) voterName = nameMatch[1].trim();

      const fatherMatch = context.match(/(?:वडीलांचे नाव|पतीचे नाव|Father's Name|Husband's Name)\s*[:：]\s*([^ \n\r\t]+(?: [^ \n\r\t]+)*)/);
      if (fatherMatch) fatherName = fatherMatch[1].trim();

      const houseMatch = context.match(/(?:घर क्र\.|House No\.?)\s*[:：]\s*([^ \n\r\t]+)/);
      if (houseMatch) houseNo = houseMatch[1].trim();

      const ageMatch = context.match(/(?:वय|Age)\s*[:：]\s*(\d+)/);
      if (ageMatch) age = parseInt(ageMatch[1], 10);

      const genderMatch = context.match(/(?:लिंग|Gender)\s*[:：]\s*(स्त्री|पुरुष|Female|Male)/);
      if (genderMatch) {
        const g = genderMatch[1].trim();
        gender = (g === "स्त्री" || g === "Female") ? "Female" : "Male";
      }

      votersMap.set(epic, {
        epic_number: epic,
        voter_name: voterName || `Voter ${epic}`,
        father_husband_name: fatherName || "",
        house_no: houseNo || "",
        age,
        gender: gender || undefined,
        ward_number: "26"
      });
    }

    const voters = Array.from(votersMap.values());
    
    if (voters.length === 0) {
      return NextResponse.json({ success: false, error: "No voters found in the PDF" }, { status: 400 });
    }

    // Batch Upsert
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < voters.length; i += batchSize) {
      const batch = voters.slice(i, i + batchSize);
      const { error } = await supabase
        .from("voter_list")
        .upsert(batch, { onConflict: "epic_number" });
      
      if (!error) inserted += batch.length;
      else console.error("Batch error:", error);
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: voters.length,
        inserted,
        pages: pdfData.numpages || 0
      }
    });

  } catch (error: any) {
    console.error("PDF Upload Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to process PDF" 
    }, { status: 500 });
  }
}
