import { NextResponse } from "next/server";
import { listIncome } from "@/app/(app)/income/actions";

export async function GET() {
  return NextResponse.json(await listIncome());
}
