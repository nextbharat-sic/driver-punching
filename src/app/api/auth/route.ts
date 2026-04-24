import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { name, phone } = await request.json();

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and Phone are required" },
      { status: 400 }
    );
  }

  try {
    let driver = await prisma.driver.findUnique({
      where: { phone },
    });

    let isNew = false;
    if (!driver) {
      driver = await prisma.driver.create({
        data: { name, phone, isVerified: false },
      });
      isNew = true;
    }

    const cookieStore = await cookies();
    cookieStore.set("driverId", driver.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ driver, isNew });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
