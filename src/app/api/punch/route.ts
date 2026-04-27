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

    // Handle automated calculations for Shift End
    let totalKms = 0;
    let totalHrs = "0";
    let startOdo = 0;
    let startTime = "";
    let endOdo = 0;
    let endTime = "";
    let rideId = "";

    const istOffset = 5.5 * 60 * 60 * 1000;
    const currentIst = new Date(new Date().getTime() + istOffset).toISOString().split('T')[1].slice(0, 5);

    if (type === "IN") {
      startOdo = parseFloat(odometer);
      startTime = currentIst;
      rideId = crypto.randomUUID();
    } else {
      const startRecord = await prisma.punchRecord.findFirst({
        where: { 
          driverId, 
          type: "IN",
          vehicleId: vehicleId || null 
        },
        orderBy: { timestamp: "desc" }
      });

      if (startRecord) {
        startOdo = startRecord.odometer;
        startTime = new Date(new Date(startRecord.timestamp).getTime() + istOffset).toISOString().split('T')[1].slice(0, 5);
        rideId = startRecord.rideId || "";
        
        endOdo = parseFloat(odometer);
        endTime = currentIst;
        
        totalKms = endOdo - startOdo;
        const durationMs = new Date().getTime() - new Date(startRecord.timestamp).getTime();
        totalHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);
      }
    }

    // Create Punch Record
    const punchRecord = await prisma.punchRecord.create({
      data: {
        driverId,
        rideId,
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

    // Trigger n8n for both shift start and shift end
    if (punchRecord.clientUser && punchRecord.vehicle) {
      try {
        await triggerN8nEmail({
          driverName: driver.name,
          driverPhone: driver.phone,
          userName: punchRecord.clientUser.name,
          userEmail: punchRecord.clientUser.email,
          vehicleNumber: punchRecord.vehicle.vehicleNumber,
          odometer: punchRecord.odometer,
          event: type === "IN" ? "SHIFT_STARTED" : "SHIFT_ENDED",
          totalKms: type === "OUT" ? totalKms : undefined,
          totalHrs: type === "OUT" ? totalHrs : undefined,
          startOdo,
          startTime,
          endOdo: type === "OUT" ? endOdo : undefined,
          endTime: type === "OUT" ? endTime : undefined,
          rideId,
        });
      } catch (err) {
        console.error("Failed to trigger n8n:", err);
      }
    }

    return NextResponse.json({ punchRecord });
  } catch (error) {
    console.error("Punch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
