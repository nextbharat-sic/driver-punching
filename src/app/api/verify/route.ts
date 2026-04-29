import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { triggerN8nEmail } from "@/lib/n8n";

export async function POST(request: Request) {
  try {
    const { punchId, status } = await request.json();

    if (!punchId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const punchRecord = await prisma.punchRecord.update({
      where: { id: punchId },
      data: { status },
      include: {
        driver: true,
        clientUser: true,
        vehicle: true,
      },
    });

    if (punchRecord.clientUser && punchRecord.vehicle) {
      await triggerN8nEmail({
        driverName: punchRecord.driver.name,
        driverPhone: punchRecord.driver.phone,
        userName: punchRecord.clientUser.name,
        userEmail: punchRecord.clientUser.email,
        vehicleNumber: punchRecord.vehicle.vehicleNumber,
        odometer: punchRecord.odometer,
        event: status as "VERIFIED" | "REJECTED",
        rideId: punchRecord.rideId || undefined,
        status: punchRecord.status,
      });
    }

    return NextResponse.json({ success: true, status: punchRecord.status });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
