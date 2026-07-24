"use server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export type ExpenseInput = {
  id?: number;
  date: string;
  property: string;
  category?: string | null;
  amount: number;
  details?: string | null;
};

export async function listExpenses() {
  const { data, error } = await supabaseAdmin().from("expenses").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listExpenseCategories(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("categories").select("name").eq("kind", "expense").order("name");
  if (error) throw error;
  return (data ?? []).map((r) => r.name);
}

export async function saveExpense(input: ExpenseInput) {
  const sb = supabaseAdmin();
  const payload = {
    date: input.date,
    property: input.property,
    category: input.category || null,
    amount: input.amount,
    details: input.details || null,
  };
  if (input.id) {
    const { error } = await sb.from("expenses").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("expenses").insert(payload);
    if (error) throw error;
  }
  updateTag(CACHE_TAGS.expenses);
  revalidatePath("/expenses");
  revalidatePath("/expenses-overview");
  revalidatePath("/");
}

export async function deleteExpense(id: number) {
  const { error } = await supabaseAdmin().from("expenses").delete().eq("id", id);
  if (error) throw error;
  updateTag(CACHE_TAGS.expenses);
  revalidatePath("/expenses");
  revalidatePath("/expenses-overview");
  revalidatePath("/");
}
