import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("isAdmin")?.value === "true";
  return isAdmin;
}

export async function GET() {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ drivers });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isVerified, deviceId } = await request.json();
    
    const data: any = {};
    if (isVerified !== undefined) data.isVerified = isVerified;
    if (deviceId !== undefined) data.deviceId = deviceId;

    const driver = await prisma.driver.update({
      where: { id },
      data,
    });
    return NextResponse.json({ driver });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
