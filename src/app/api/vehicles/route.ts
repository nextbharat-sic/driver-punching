import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, vehicleNumber: true },
      orderBy: { vehicleNumber: "asc" },
    });
    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error("Fetch vehicles error details:", error);

    let userMessage = "Internal Server Error";
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("127.0.0.1") || process.env.DATABASE_URL.includes("localhost")) {
      userMessage = "Database Error: Valid DATABASE_URL not found. Please set it in Vercel environment variables.";
    }

    return NextResponse.json({ 
      error: userMessage, 
      details: error.message 
    }, { status: 500 });
  }
}
