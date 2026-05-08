import { NextResponse } from "next/server";
import { listBookings } from "@/app/(app)/bookings/actions";

export async function GET() {
  const data = await listBookings();
  return NextResponse.json(data);
}
