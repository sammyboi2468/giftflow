"use client";

import { useState } from "react";
import { User, Building2, SlidersHorizontal, Save, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { updateSettings, type SettingsInput } from "@/app/actions/settings-actions"

type Section = "Profile" | "Department Defaults" | "Notifications";

interface Props {
  canSubmit: boolean;
  profile: { name: string; email: string; roleLabel: string; department: string };
  initial: SettingsInput;
}

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all";
const labelClass = "text-[11px] font-bold text-slate-500";

export default function SettingsForm({ canSubmit, profile, initial }: Props) {
  const tabs = [
    { name: "Profile" as Section, icon: User },
    ...(canSubmit ? [{ name: "Department Defaults" as Section, icon: Building2 }] : []),
    { name: "Notifications" as Section, icon: SlidersHorizontal },
  ];

  const [section, setSection] = useState<Section>("Profile");
  const [saved, setSaved] = useState<SettingsInput>(initial); // last value stored in the database
  const [values, setValues] = useState<SettingsInput>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const editable = section !== "Profile";

  const set = <K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const result = await updateSettings(values);

    setSaving(false);
    if (result.success) {
      setSaved(values);
      setMessage({ type: "success", text: "Settings saved." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Could not save your settings." });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] font-sans text-slate-600">
      <header className="border-b border-slate-100 bg-white px-8 py-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          View your account and manage your submission defaults and notifications
        </p>
      </header>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-6 p-6 md:grid-cols-4">
        <nav className="space-y-1 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm md:col-span-1">
          {tabs.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setSection(name);
                setMessage(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all outline-none ${
                section === name
                  ? "bg-[#5D5CFF]/10 text-[#5D5CFF]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <form onSubmit={handleSave} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:col-span-3">
          {message && (
            <div
              role="status"
              className={`flex items-center gap-2 border-b p-4 text-xs font-semibold ${
                message.type === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                  : "border-rose-100 bg-rose-50 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* PROFILE (read-only) */}
          {section === "Profile" && (
            <div className="space-y-6 p-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold tracking-tight text-slate-800">Your account</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Lock className="h-3 w-3" />
                  Managed by an administrator. Contact them if anything here is wrong.
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Full name", profile.name],
                  ["Email address", profile.email],
                  ["Role", profile.roleLabel],
                  ["Department", profile.department],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1.5">
                    <dt className={labelClass}>{label}</dt>
                    <dd className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs font-semibold text-slate-800 break-words">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* SUBMISSION DEFAULTS */}
          {section === "Department Defaults" && canSubmit && (
            <div className="space-y-6 p-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold tracking-tight text-slate-800">Submission defaults</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Used to pre-fill new gift requests. You can still change them on each request.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="origin" className={labelClass}>Origin level</label>
                  <select
                    id="origin"
                    value={values.defaultOriginLevel}
                    onChange={(e) => set("defaultOriginLevel", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">No default</option>
                    <option value="DEPARTMENT">Department level</option>
                    <option value="FACULTY">Faculty level</option>
                    <option value="ADVANCEMENT_OFFICE">Advancement Office</option>
                    <option value="UNIVERSITY">University management / central</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="faculty" className={labelClass}>Faculty or group name</label>
                  <input
                    id="faculty"
                    type="text"
                    maxLength={120}
                    value={values.defaultFaculty}
                    onChange={(e) => set("defaultFaculty", e.target.value)}
                    placeholder="e.g. Faculty of Engineering"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="ledger" className={labelClass}>General ledger code</label>
                  <input
                    id="ledger"
                    type="text"
                    maxLength={40}
                    value={values.defaultLedgerCode}
                    onChange={(e) => set("defaultLedgerCode", e.target.value)}
                    placeholder="e.g. GL-77204-ENG"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "Notifications" && (
            <div className="space-y-6 p-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold tracking-tight text-slate-800">Notifications</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">Choose which updates appear in your notification bell</p>
              </div>

              <div className="flex items-center justify-between gap-6 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold tracking-tight text-slate-800">Routine stage updates</h4>
                  <p className="max-w-md text-[10px] font-medium text-slate-400">
                    Requests moving to the next stage, resubmissions, and new requests arriving in your queue.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.notifyRoutineUpdates}
                  aria-label="Routine stage updates"
                  onClick={() => set("notifyRoutineUpdates", !values.notifyRoutineUpdates)}
                  className={`relative flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-all ${
                    values.notifyRoutineUpdates ? "bg-[#5D5CFF]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all ${
                      values.notifyRoutineUpdates ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                You will always be notified when a request is rejected, needs more information, has a Decision
                Extract issued, or is approved, because those need your attention or are final outcomes.
              </p>
            </div>
          )}

          {editable && (
            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="submit"
                disabled={saving || !dirty}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#4c4be6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save settings
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}