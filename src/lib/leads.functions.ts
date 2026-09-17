import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;

export const submitLead = createServerFn({ method: "POST" })
  .validator((data: unknown) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    const { error, data: row } = await supabaseAdmin
      .from("leads")
      .insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        message: data.message || null,
        source: data.source || "landing",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[leads] insert failed:", error);
      return { ok: false as const, error: "We couldn't record your request. Please try again." };
    }

    // Email notification is enqueued once an email domain is configured in
    // Lovable Cloud → Emails. The send-transactional server route picks it up
    // automatically. Until then, we log so the user has full visibility.
    console.info("[leads] new demo request", {
      id: row?.id,
      email: data.email,
      company: data.company,
    });

    return { ok: true as const, id: row?.id };
  });
