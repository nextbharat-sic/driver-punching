import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, vehicleNumber: true },
      orderBy: { vehicleNumber: "asc" },
    });
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Fetch vehicles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
