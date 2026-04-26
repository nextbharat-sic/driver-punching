import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.clientUser.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Fetch users error details:", error);

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
