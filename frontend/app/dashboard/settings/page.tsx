"use client";
/**
 * Settings: alerts, risk threshold and scan schedule.
 * Values live in page state for now. Next step: persist them per user
 * through the agent API.
 */
import { useState } from "react";
import { ClayButton, ClayToggle, GlassPanel, PageHeader } from "@/components/ui";
import { useToast } from "@/components/Providers";

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/70 py-4 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-slate">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    dailyEmail: true,
    slackAlerts: false,
    instantHighRisk: true,
    threshold: 70,
    scanTime: "07:00",
    frequency: "daily",
  });
  const set = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader title="Settings" subtitle="Choose how and when AccountPulse alerts you." />

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <Row title="Daily briefing by email" hint="A short summary every morning">
            <ClayToggle label="Daily briefing by email" checked={prefs.dailyEmail} onChange={(v) => set("dailyEmail", v)} />
          </Row>
          <Row title="Slack alerts" hint="Post new high-risk accounts to a channel">
            <ClayToggle label="Slack alerts" checked={prefs.slackAlerts} onChange={(v) => set("slackAlerts", v)} />
          </Row>
          <Row title="Instant high-risk alerts" hint="Notify me as soon as an account crosses the threshold">
            <ClayToggle label="Instant high-risk alerts" checked={prefs.instantHighRisk} onChange={(v) => set("instantHighRisk", v)} />
          </Row>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold">Risk and scanning</h2>
          <div className="border-b border-white/70 py-4">
            <div className="flex items-center justify-between">
              <label htmlFor="threshold" className="font-semibold">
                High-risk threshold
              </label>
              <span className="clay font-display rounded-xl px-3 py-1 text-sm font-bold text-coral">{prefs.threshold}</span>
            </div>
            <p className="text-sm text-slate">Accounts scoring at or above this are marked high risk.</p>
            <input
              id="threshold"
              type="range"
              min={40}
              max={95}
              step={5}
              value={prefs.threshold}
              onChange={(e) => set("threshold", Number(e.target.value))}
              className="mt-4 w-full accent-[#4b4ded]"
            />
          </div>
          <div className="flex flex-col gap-4 py-4 sm:flex-row">
            <label className="flex-1 text-sm">
              <span className="mb-1.5 block font-semibold">Scan frequency</span>
              <select
                value={prefs.frequency}
                onChange={(e) => set("frequency", e.target.value)}
                className="clay focus-ring h-11 w-full rounded-xl px-3 font-semibold outline-none"
              >
                <option value="hourly">Every hour</option>
                <option value="daily">Once a day</option>
                <option value="weekly">Once a week</option>
              </select>
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1.5 block font-semibold">Scan time</span>
              <input
                type="time"
                value={prefs.scanTime}
                onChange={(e) => set("scanTime", e.target.value)}
                className="clay-inset focus-ring h-11 w-full rounded-xl px-3 font-semibold outline-none"
              />
            </label>
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 flex justify-end">
        <ClayButton variant="primary" onClick={() => toast("Settings saved")}>
          Save settings
        </ClayButton>
      </div>
    </>
  );
}
