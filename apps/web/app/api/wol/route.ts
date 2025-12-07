import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  // Verify authentication
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get credentials from environment
  const payload = {
    uid: process.env.JDXB_UID,
    owcode: process.env.JDXB_OWCODE,
    peerid: process.env.JDXB_PEERID,
    macstr: process.env.ASUS_MAC,
    product: parseInt(process.env.JDXB_PRODUCT || "2581"),
  };

  try {
    const response = await fetch("https://jdis.ionewu.com/jdis/wakeup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // JDXB returns { rtn: 0 } for success
    if (data.rtn === 0) {
      return NextResponse.json({
        success: true,
        message: "WOL signal sent successfully",
        serverConfirmed: true,
        data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `API error (rtn: ${data.rtn})`,
          data,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("WOL API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    mac: process.env.ASUS_MAC,
    deviceName: "ASUS PC",
    status: "ready",
  });
}
