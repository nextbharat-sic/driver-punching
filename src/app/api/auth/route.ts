import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
export async function POST(request: Request) {
  const { name, phone, deviceId } = await request.json();

  if (!name || !phone || !deviceId) {
    return NextResponse.json(
      { error: "Name, Phone, and Device Identification are required" },
      { status: 400 }
    );
  }

  try {
    let driver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (driver) {
      // Check for device binding
      if (driver.deviceId && driver.deviceId !== deviceId) {
        return NextResponse.json(
          { error: "Device Mismatch: This account is bound to another phone. Please contact admin for reset." },
          { status: 403 }
        );
      }

      // If driver exists but no deviceId bound yet (first login after update)
      if (!driver.deviceId) {
        driver = await prisma.driver.update({
          where: { id: driver.id },
          data: { deviceId },
        });
      }
    } else {
      // Create new driver and bind deviceId immediately
      driver = await prisma.driver.create({
        data: { name, phone, deviceId, isVerified: true },
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("driverId", driver.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ driver });
  } catch (error: any) {
...
    console.error("Auth error details:", error);

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
