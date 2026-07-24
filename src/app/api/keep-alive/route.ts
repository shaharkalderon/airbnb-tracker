import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Hit by a Vercel Cron daily to keep the Supabase project from auto-pausing
// after 7 days of inactivity. Runs a trivial read so the DB registers activity.
export async function GET(req: NextRequest) {
  // If CRON_SECRET is configured, require it (Vercel Cron sends it automatically).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await supabaseAdmin()
    .from("income")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
