import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { calculateDistance } from "@/lib/geo";
import { triggerN8nEmail } from "@/lib/n8n";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const driverId = cookieStore.get("driverId")?.value;

  if (!driverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, odometer, latitude, longitude, clientUserId, vehicleId } = await request.json();

  if (!type || odometer === undefined || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (!driver.isVerified) {
      return NextResponse.json({ error: "Account not verified" }, { status: 403 });
    }

    // Geo-fencing check for Start (Punch In)
    if (type === "IN") {
      const depotLat = parseFloat(process.env.DEPOT_LAT || "28.6139");
      const depotLng = parseFloat(process.env.DEPOT_LNG || "77.209");
      const radius = parseFloat(process.env.GEO_FENCE_RADIUS || "500");

      const distance = calculateDistance(latitude, longitude, depotLat, depotLng);

      if (distance > radius) {
        return NextResponse.json(
          { error: `Too far from depot (${Math.round(distance)}m). You must be within ${radius}m.` },
          { status: 403 }
        );
      }
    }

    // Create Punch Record
    const punchRecord = await prisma.punchRecord.create({
      data: {
        driverId,
        clientUserId: clientUserId || null,
        vehicleId: vehicleId || null,
        type,
        odometer: parseFloat(odometer),
        latitude,
        longitude,
      },
      include: {
        clientUser: true,
        vehicle: true,
      }
    });

    // Update Driver Status
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        status: type === "IN" ? "ACTIVE" : "IDLE",
      },
    });

    // Trigger n8n email for shift start
    if (type === "IN" && punchRecord.clientUser && punchRecord.vehicle) {
      // Run in background
      triggerN8nEmail({
        driverName: driver.name,
        userName: punchRecord.clientUser.name,
        userEmail: punchRecord.clientUser.email,
        vehicleNumber: punchRecord.vehicle.vehicleNumber,
        odometer: punchRecord.odometer,
      }).catch(err => console.error("Failed to trigger n8n email:", err));
    }

    return NextResponse.json({ punchRecord });
  } catch (error) {
    console.error("Punch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
