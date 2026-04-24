import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { calculateDistance } from "@/lib/geo";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, odometer, latitude, longitude } = await request.json();

  if (!type || odometer === undefined || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Geo-fencing check for Start (Punch In)
    if (type === "IN") {
      const depotLat = parseFloat(process.env.DEPOT_LAT || "0");
      const depotLng = parseFloat(process.env.DEPOT_LNG || "0");
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
        userId,
        type,
        odometer: parseFloat(odometer),
        latitude,
        longitude,
      },
    });

    // Update User Status
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: type === "IN" ? "ACTIVE" : "IDLE",
      },
    });

    return NextResponse.json({ punchRecord });
  } catch (error) {
    console.error("Punch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
