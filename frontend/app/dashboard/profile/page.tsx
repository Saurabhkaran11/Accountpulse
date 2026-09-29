"use client";
/**
 * Profile: update your name, email, role and time zone.
 * Saving updates the avatar in the top bar immediately (shared UserContext).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ClayButton, GlassPanel, PageHeader } from "@/components/ui";
import { useToast, useUser } from "@/components/Providers";

const timezones = ["America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Asia/Kolkata"];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = "clay-inset focus-ring h-11 w-full rounded-xl px-3 text-sm outline-none";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const toast = useToast();
  const [form, setForm] = useState(user);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter an email like name@company.com.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setUser({ ...form, initials: initialsOf(form.name) });
    toast("Profile saved");
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="How you appear to your team and when your briefing arrives." />

      <form onSubmit={save} noValidate className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <GlassPanel className="flex flex-col items-center p-6 text-center">
          <motion.span
            key={initialsOf(form.name)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="clay font-display grid size-24 place-items-center rounded-full text-3xl font-bold text-pulse"
          >
            {initialsOf(form.name)}
          </motion.span>
          <p className="font-display mt-4 text-lg font-semibold">{form.name || "Your name"}</p>
          <p className="text-sm text-slate">{form.role}</p>
        </GlassPanel>

        <GlassPanel className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" error={errors.name}>
              <input
                id="name"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
            </Field>
            <Field id="email" label="Work email" error={errors.email}>
              <input
                id="email"
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </Field>
            <Field id="role" label="Role">
              <input id="role" className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Field>
            <Field id="company" label="Company">
              <input id="company" className={inputCls} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field id="tz" label="Time zone">
              <select id="tz" className={`${inputCls} font-semibold`} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                {timezones.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <ClayButton type="button" onClick={() => { setForm(user); setErrors({}); }}>
              Discard changes
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Save profile
            </ClayButton>
          </div>
        </GlassPanel>
      </form>
    </>
  );
}
