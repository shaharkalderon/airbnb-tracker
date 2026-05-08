"use server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type IncomeInput = {
  id?: number;
  date: string;
  property: string;
  category?: string | null;
  amount: number;
  details?: string | null;
};

export async function listIncome() {
  const { data, error } = await supabaseAdmin().from("income").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listIncomeCategories(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("categories").select("name").eq("kind", "income").order("name");
  if (error) throw error;
  return (data ?? []).map((r) => r.name);
}

export async function saveIncome(input: IncomeInput) {
  const sb = supabaseAdmin();
  const payload = {
    date: input.date,
    property: input.property,
    category: input.category || null,
    amount: input.amount,
    details: input.details || null,
  };
  if (input.id) {
    const { error } = await sb.from("income").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("income").insert(payload);
    if (error) throw error;
  }
  revalidatePath("/income");
  revalidatePath("/");
  revalidatePath("/monthly-overview");
}

export async function deleteIncome(id: number) {
  const { error } = await supabaseAdmin().from("income").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/income");
  revalidatePath("/");
}
