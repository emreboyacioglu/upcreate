import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CSV_PATH = path.join(process.cwd(), "data", "brands.csv");

const HEADERS = ["Tarih", "Marka Adı", "Website", "Kategori", "Email", "Not"];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, website, category, email, notes } = body;

    await fs.mkdir(path.dirname(CSV_PATH), { recursive: true });

    let fileExists = false;
    try {
      await fs.access(CSV_PATH);
      fileExists = true;
    } catch {}

    const timestamp = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    const row = [timestamp, brandName, website, category, email, notes ?? ""]
      .map(escapeCsvField)
      .join(",");

    const content = fileExists
      ? `\n${row}`
      : `${HEADERS.join(",")}\n${row}`;

    await fs.appendFile(CSV_PATH, content, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand form CSV error:", error);
    return NextResponse.json({ success: false, error: "Kayıt hatası" }, { status: 500 });
  }
}
