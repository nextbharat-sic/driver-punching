import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const driverId = cookieStore.get("driverId")?.value;

  if (!driverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true, phone: true, status: true, isVerified: true },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    let activeShift = null;
    if (driver.status === "ACTIVE") {
      activeShift = await prisma.punchRecord.findFirst({
        where: { driverId, type: "IN" },
        orderBy: { timestamp: "desc" },
        include: {
          clientUser: true,
          vehicle: true,
        },
      });
    }

    return NextResponse.json({ driver, activeShift });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
