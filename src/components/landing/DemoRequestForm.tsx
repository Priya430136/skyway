import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { submitLead } from "@/lib/leads.functions";
import { track } from "@/lib/analytics";

const Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormErrors = Partial<Record<keyof z.infer<typeof Schema>, string>>;

export function DemoRequestForm() {
  const submit = useServerFn(submitLead);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const candidate = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || ""),
      message: String(form.get("message") || ""),
    };

    const parsed = Schema.safeParse(candidate);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      track("demo_form_error", { fields: Object.keys(next).join(",") });
      return;
    }

    setErrors({});
    setStatus("loading");
    setServerError(null);
    try {
      const res = await submit({ data: { ...parsed.data, source: "landing-demo" } });
      if (!res.ok) {
        setStatus("error");
        setServerError(res.error);
        track("demo_form_error", { reason: "server" });
        return;
      }
      setStatus("success");
      track("demo_form_submitted", { company: parsed.data.company || "" });
      formEl.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setServerError("Something went wrong. Please try again.");
      track("demo_form_error", { reason: "exception" });
    }
  };

  return (
    <section id="demo" className="bg-sky-surface py-24" aria-labelledby="demo-heading">
      <div className="container mx-auto grid grid-cols-1 gap-16 px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="mb-4 inline-block rounded-full bg-sky-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-accent">
            Talk to operations
          </span>
          <h2
            id="demo-heading"
            className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl"
          >
            Request a tailored demo.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-sky-dark/60">
            Tell us about your network and we'll route you to the specialist team
            best matched to your operations. Most carriers hear back within one
            business day.
          </p>
          <dl className="mt-10 space-y-4 text-sm text-sky-dark/70">
            <div className="flex gap-3">
              <dt className="font-display font-semibold text-sky-dark">Email</dt>
              <dd>ops@skyway.example</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-display font-semibold text-sky-dark">SLA</dt>
              <dd>24 h response, 99.998% platform uptime</dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-sky-dark/5 bg-white p-8 shadow-xl shadow-sky-dark/5"
          noValidate
        >
          <Field
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            error={errors.name}
            required
          />
          <Field
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
            error={errors.email}
            required
          />
          <Field
            label="Company"
            name="company"
            type="text"
            autoComplete="organization"
            error={errors.company}
          />
          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-dark/60"
            >
              How can we help?
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-sky-dark/10 bg-sky-surface px-4 py-3 font-sans text-sm text-sky-dark placeholder:text-sky-dark/30 focus:border-sky-accent focus:outline-none focus:ring-2 focus:ring-sky-accent/20"
              placeholder="Fleet size, current systems, regions served…"
            />
            {errors.message && <FieldError>{errors.message}</FieldError>}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            onClick={() => track("cta_demo_clicked", { surface: "form-button" })}
            className="w-full rounded-xl bg-sky-dark px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-sky-accent disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Request demo"}
          </button>

          {status === "success" && (
            <p className="rounded-lg bg-sky-accent/10 px-4 py-3 text-sm text-sky-accent">
              Thanks — we've logged your request and our team will be in touch shortly.
            </p>
          )}
          {status === "error" && serverError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function Field(props: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={props.name}
        className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-dark/60"
      >
        {props.label}
        {props.required ? " *" : ""}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type}
        autoComplete={props.autoComplete}
        aria-invalid={props.error ? true : undefined}
        className="w-full rounded-xl border border-sky-dark/10 bg-sky-surface px-4 py-3 font-sans text-sm text-sky-dark placeholder:text-sky-dark/30 focus:border-sky-accent focus:outline-none focus:ring-2 focus:ring-sky-accent/20"
      />
      {props.error && <FieldError>{props.error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-destructive">{children}</p>;
}
