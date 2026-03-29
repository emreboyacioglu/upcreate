import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CSV_PATH = path.join(process.cwd(), "data", "creators.csv");

const HEADERS = ["Tarih", "İsim", "Email", "Instagram", "TikTok", "Kategori", "Takipçi Sayısı"];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, instagram, tiktok, category, followers } = body;

    await fs.mkdir(path.dirname(CSV_PATH), { recursive: true });

    let fileExists = false;
    try {
      await fs.access(CSV_PATH);
      fileExists = true;
    } catch {}

    const timestamp = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    const row = [timestamp, name, email, instagram, tiktok ?? "", category, followers]
      .map(escapeCsvField)
      .join(",");

    const content = fileExists
      ? `\n${row}`
      : `${HEADERS.join(",")}\n${row}`;

    await fs.appendFile(CSV_PATH, content, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Creator form CSV error:", error);
    return NextResponse.json({ success: false, error: "Kayıt hatası" }, { status: 500 });
  }
}
