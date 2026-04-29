import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const punchRecord = await prisma.punchRecord.findUnique({
      where: { id },
      include: {
        driver: true,
        clientUser: true,
        vehicle: true,
      },
    });

    if (!punchRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ punchRecord });
  } catch (error) {
    console.error("Fetch punch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
