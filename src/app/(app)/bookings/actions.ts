"use server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export type BookingInput = {
  id?: number;
  check_in: string;
  check_out: string;
  booking?: string | null;
  guests?: number | null;
  property: string;
  channel?: string | null;
  rental_period?: number | null;
  income?: number | null;
  details?: string | null;
  booking_date?: string | null;
};

export async function listBookings() {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .order("check_in", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveBooking(input: BookingInput) {
  const sb = supabaseAdmin();
  const payload = {
    check_in: input.check_in,
    check_out: input.check_out,
    booking: input.booking || null,
    guests: input.guests ?? null,
    property: input.property,
    channel: input.channel || null,
    rental_period: input.rental_period ?? null,
    income: input.income ?? null,
    details: input.details || null,
    booking_date: input.booking_date || null,
  };
  if (input.id) {
    const { error } = await sb.from("bookings").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("bookings").insert(payload);
    if (error) throw error;
  }
  updateTag(CACHE_TAGS.bookings);
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteBooking(id: number) {
  const { error } = await supabaseAdmin().from("bookings").delete().eq("id", id);
  if (error) throw error;
  updateTag(CACHE_TAGS.bookings);
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/");
}
