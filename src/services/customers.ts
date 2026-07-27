import { supabaseAdmin } from "../lib/supabaseClient.js";

export async function findOrCreateCustomer(phone: string): Promise<string> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to look up customer: ${findError.message}`);
  }

  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("cusomers")
    .insert({ phone_number: phone })
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Failed to create customer: ${createError.message}`);
  }

  return created.id;
}
