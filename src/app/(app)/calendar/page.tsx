import { supabaseAdmin } from "@/lib/supabase/server";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("id, check_in, check_out, booking, guests, property, channel, income, booking_date");
  if (error) throw error;
  return <CalendarClient bookings={data ?? []} />;
}
