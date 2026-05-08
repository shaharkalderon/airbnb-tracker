import { NextResponse } from "next/server";
import { listExpenses } from "@/app/(app)/expenses/actions";

export async function GET() {
  return NextResponse.json(await listExpenses());
}
