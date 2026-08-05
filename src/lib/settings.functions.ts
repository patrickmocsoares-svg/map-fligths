/**
 * Business settings (miles pricing + contact channels).
 *
 * Public surfaces read a safe subset through `getPublicSettingsFn`
 * (service-role read of a single row, no secrets exposed).
 * Admin surfaces read/write through the admin-guarded functions.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DEFAULT_MILES_SETTINGS, type MilesSettings } from "@/lib/miles";

type Row = {
  cost_per_mile: number;
  mile_value_ref: number;
  markup_fixed: number;
  airport_tax: number;
  whatsapp_number: string;
  business_hours: string;
  contact_email: string;
};

function toSettings(row: Row | null): MilesSettings {
  if (!row) return DEFAULT_MILES_SETTINGS;
  return {
    costPerMile: Number(row.cost_per_mile),
    mileValueRef: Number(row.mile_value_ref),
    markupFixed: Number(row.markup_fixed),
    airportTax: Number(row.airport_tax),
    whatsappNumber: row.whatsapp_number,
    businessHours: row.business_hours,
    contactEmail: row.contact_email,
  };
}

const SELECT =
  "cost_per_mile, mile_value_ref, markup_fixed, airport_tax, whatsapp_number, business_hours, contact_email";

export const getPublicSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<MilesSettings> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("settings").select(SELECT).limit(1).maybeSingle();
    return toSettings((data as Row | null) ?? null);
  },
);

const updateSchema = z.object({
  costPerMile: z.number().min(0).max(1),
  mileValueRef: z.number().min(0.001).max(1),
  markupFixed: z.number().min(0).max(100000),
  airportTax: z.number().min(0).max(100000),
  whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, "Use apenas dígitos (ex: 5511999999999)"),
  businessHours: z.string().trim().min(3).max(160),
  contactEmail: z.string().trim().email().max(160),
});

export const updateSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }): Promise<MilesSettings> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("settings")
      .update({
        cost_per_mile: data.costPerMile,
        mile_value_ref: data.mileValueRef,
        markup_fixed: data.markupFixed,
        airport_tax: data.airportTax,
        whatsapp_number: data.whatsappNumber,
        business_hours: data.businessHours,
        contact_email: data.contactEmail,
      })
      .eq("singleton", true)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toSettings(updated as Row);
  });
