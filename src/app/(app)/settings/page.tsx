"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  List,
  ListItem,
  Sheet,
  Radio,
} from "konsta/react";
import { useAuth } from "@/hooks/useAuth";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useEnvironmentStore } from "@/stores/environment-store";
import { getLangName } from "@/components/ui/EnvSwitcher";

const LANGUAGES = [
  { code: "en", name: "English", icon: "🇬🇧" },
  { code: "he", name: "Hebrew", icon: "🇮🇱" },
  { code: "fr", name: "French", icon: "🇫🇷" },
  { code: "es", name: "Spanish", icon: "🇪🇸" },
  { code: "ar", name: "Arabic", icon: "🇸🇦" },
  { code: "de", name: "German", icon: "🇩🇪" },
  { code: "it", name: "Italian", icon: "🇮🇹" },
  { code: "pt", name: "Portuguese", icon: "🇵🇹" },
  { code: "ja", name: "Japanese", icon: "🇯🇵" },
  { code: "ko", name: "Korean", icon: "🇰🇷" },
  { code: "zh", name: "Chinese", icon: "🇨🇳" },
  { code: "ru", name: "Russian", icon: "🇷🇺" },
  { code: "hi", name: "Hindi", icon: "🇮🇳" },
  { code: "nl", name: "Dutch", icon: "🇳🇱" },
  { code: "sv", name: "Swedish", icon: "🇸🇪" },
  { code: "pl", name: "Polish", icon: "🇵🇱" },
  { code: "tr", name: "Turkish", icon: "🇹🇷" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[28px] w-[50px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-500" : "bg-gray-200"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform duration-200 mt-[2px] ${
          checked ? "translate-x-[24px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, updatePassword } = useAuth();
  const { environments, createEnvironment, deleteEnvironment, switchEnvironment } = useEnvironment();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const { prefs, loading: prefsLoading, updatePrefs, pushPermission, requestPushPermission } =
    useNotificationPreferences();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete language state
  const [deleteConfirmEnvId, setDeleteConfirmEnvId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import state
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ deckName: string; wordCount: number } | null>(null);
  const [importError, setImportError] = useState("");

  // Password change state
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Goal sheet state
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [tempGoalWords, setTempGoalWords] = useState(prefs.daily_goal_words);
  const [tempGoalSessions, setTempGoalSessions] = useState(prefs.daily_goal_sessions);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const existingCodes = new Set(environments.map((e) => e.target_lang));
  const availableLanguages = LANGUAGES.filter((l) => !existingCodes.has(l.code));

  const handleAddLanguage = async () => {
    if (!selectedLang) return;
    setAdding(true);
    const lang = LANGUAGES.find((l) => l.code === selectedLang);
    await createEnvironment(selectedLang, "#007AFF", lang?.icon ?? "🌍");
    setAdding(false);
    setAddSheetOpen(false);
    setSelectedLang("");
  };

  const handleDeleteLanguage = async () => {
    if (!deleteConfirmEnvId) return;
    setDeleting(true);

    // If deleting the active env, switch to another one first
    if (deleteConfirmEnvId === activeEnvironmentId) {
      const otherEnv = environments.find((e) => e.id !== deleteConfirmEnvId);
      if (otherEnv) {
        await switchEnvironment(otherEnv.id);
      }
    }

    await deleteEnvironment(deleteConfirmEnvId);
    setDeleting(false);
    setDeleteConfirmEnvId(null);
  };

  const handleSetDefault = async (envId: string) => {
    if (envId === activeEnvironmentId) return;
    await switchEnvironment(envId);
  };

  const handleImportFile = async (file: File) => {
    if (!activeEnvironmentId) return;
    setImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("environmentId", activeEnvironmentId);

      const res = await fetch("/api/deck/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setImportError(data.error || "Import failed");
      } else {
        setImportResult({ deckName: data.deckName, wordCount: data.wordCount });
      }
    } catch {
      setImportError("Failed to import file");
    }
    setImporting(false);
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    setPwLoading(true);
    const { error } = await updatePassword(newPw);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setTimeout(() => {
        setPasswordSheetOpen(false);
        setPwSuccess(false);
        setNewPw("");
        setConfirmPw("");
      }, 1500);
    }
    setPwLoading(false);
  };

  const handleEnableNotifications = async () => {
    if (pushPermission !== "granted") {
      const perm = await requestPushPermission();
      if (perm === "granted") {
        updatePrefs({ notifications_enabled: true });
      }
    } else {
      updatePrefs({ notifications_enabled: !prefs.notifications_enabled });
    }
  };

  const handleSaveGoal = () => {
    updatePrefs({
      daily_goal_words: tempGoalWords,
      daily_goal_sessions: tempGoalSessions,
    });
    setGoalSheetOpen(false);
  };

  const toggleReminderDay = (index: number) => {
    const newDays = [...prefs.reminder_days];
    newDays[index] = !newDays[index];
    updatePrefs({ reminder_days: newDays });
  };

  const notificationsDisabled = !prefs.notifications_enabled;
  const deleteEnv = environments.find((e) => e.id === deleteConfirmEnvId);

  return (
    <>
      <div className="px-5 pt-4 pb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-5">Settings</h1>

        {/* Account */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Account</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <div className="px-4 py-3.5 flex justify-between items-center">
              <span className="text-[15px] font-medium">Email</span>
              <span className="text-[14px] text-gray-400">{user?.email ?? "---"}</span>
            </div>
            <button
              className="w-full px-4 py-3.5 flex justify-between items-center active:bg-gray-50 transition-colors"
              onClick={() => {
                setPwError("");
                setPwSuccess(false);
                setPasswordSheetOpen(true);
              }}
            >
              <span className="text-[15px] font-medium">Change Password</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Languages */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Languages</h2>
          <p className="text-[12px] text-gray-400 mb-2 px-1">Tap a language to set it as default. Swipe or tap the red button to delete.</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {environments.map((env) => {
              const isActive = env.id === activeEnvironmentId;
              return (
                <div key={env.id} className="flex items-center">
                  <button
                    className="flex-1 px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                    onClick={() => handleSetDefault(env.id)}
                  >
                    <span className="text-xl">{env.icon}</span>
                    <span className="text-[15px] font-medium flex-1 text-left">{getLangName(env.target_lang)}</span>
                    {isActive && (
                      <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Default</span>
                    )}
                  </button>
                  {environments.length > 1 && (
                    <button
                      className="px-3 py-3.5 text-red-400 active:text-red-600 transition-colors"
                      onClick={() => setDeleteConfirmEnvId(env.id)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            {availableLanguages.length > 0 && (
              <button
                className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                onClick={() => setAddSheetOpen(true)}
              >
                <span className="text-xl">+</span>
                <span className="text-[15px] font-medium text-blue-500">Add Language</span>
              </button>
            )}
          </div>
        </div>

        {/* Import / Export */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Import & Export</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <button
              className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
              onClick={() => {
                setImportError("");
                setImportResult(null);
                importFileRef.current?.click();
              }}
              disabled={importing}
            >
              <span className="text-xl">📥</span>
              <div className="flex-1 text-left">
                <span className="text-[15px] font-medium block">
                  {importing ? "Importing..." : "Import Deck"}
                </span>
                <span className="text-[12px] text-gray-400">CSV, TSV, JSON, or Anki text export</span>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <span className="text-xl">📤</span>
              <div className="flex-1">
                <span className="text-[15px] font-medium block">Export Deck</span>
                <span className="text-[12px] text-gray-400">Open a deck and tap the export button</span>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.vocafast.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />

          {importError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[13px] text-red-600">{importError}</p>
            </div>
          )}
          {importResult && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-[13px] text-green-700">
                Imported <strong>{importResult.wordCount}</strong> words into &ldquo;{importResult.deckName}&rdquo;
              </p>
              <button
                className="text-[13px] text-blue-500 font-semibold mt-1"
                onClick={() => router.push("/decks")}
              >
                Go to Decks
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Notifications</h2>

          {pushPermission === "denied" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
              <p className="text-[13px] text-amber-700">
                Notifications are blocked in your browser. Please enable them in your device settings.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {/* Master toggle */}
            <div className="px-4 py-3.5 flex justify-between items-center">
              <div>
                <span className="text-[15px] font-medium">Enable Notifications</span>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {pushPermission === "granted" ? "Allowed" : pushPermission === "denied" ? "Blocked" : "Not set up"}
                </p>
              </div>
              <Toggle
                checked={prefs.notifications_enabled && pushPermission === "granted"}
                onChange={handleEnableNotifications}
                disabled={prefsLoading || pushPermission === "denied"}
              />
            </div>

            {/* Daily Goal */}
            <div className="px-4 py-3.5 flex justify-between items-center">
              <div className="flex-1">
                <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Daily Goal</span>
                <p className={`text-[12px] mt-0.5 ${notificationsDisabled ? "text-gray-200" : "text-gray-400"}`}>
                  {prefs.daily_goal_words} words / {prefs.daily_goal_sessions} session{prefs.daily_goal_sessions > 1 ? "s" : ""} per day
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={prefs.daily_goal_enabled}
                  onChange={(v) => updatePrefs({ daily_goal_enabled: v })}
                  disabled={notificationsDisabled}
                />
                <button
                  className="text-blue-500 text-[13px] font-semibold disabled:text-gray-300"
                  disabled={notificationsDisabled || !prefs.daily_goal_enabled}
                  onClick={() => {
                    setTempGoalWords(prefs.daily_goal_words);
                    setTempGoalSessions(prefs.daily_goal_sessions);
                    setGoalSheetOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Daily Reminder */}
            <div className="px-4 py-3.5">
              <div className="flex justify-between items-center">
                <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Daily Reminder</span>
                <Toggle
                  checked={prefs.reminder_enabled}
                  onChange={(v) => updatePrefs({ reminder_enabled: v })}
                  disabled={notificationsDisabled}
                />
              </div>
              {prefs.reminder_enabled && !notificationsDisabled && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-500 w-12">Time</span>
                    <input
                      type="time"
                      value={prefs.reminder_time}
                      onChange={(e) => updatePrefs({ reminder_time: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <span className="text-[13px] text-gray-500">Days</span>
                    <div className="flex gap-1.5 mt-1.5">
                      {DAY_LABELS.map((day, i) => (
                        <button
                          key={day}
                          onClick={() => toggleReminderDay(i)}
                          className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
                            prefs.reminder_days[i]
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Streak Reminder */}
            <div className="px-4 py-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Streak Reminder</span>
                  <p className={`text-[12px] mt-0.5 ${notificationsDisabled ? "text-gray-200" : "text-gray-400"}`}>
                    Evening reminder to keep your streak
                  </p>
                </div>
                <Toggle
                  checked={prefs.streak_reminder_enabled}
                  onChange={(v) => updatePrefs({ streak_reminder_enabled: v })}
                  disabled={notificationsDisabled}
                />
              </div>
              {prefs.streak_reminder_enabled && !notificationsDisabled && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[13px] text-gray-500 w-12">Time</span>
                  <input
                    type="time"
                    value={prefs.streak_reminder_time}
                    onChange={(e) => updatePrefs({ streak_reminder_time: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            {/* Review Due */}
            <div className="px-4 py-3.5 flex justify-between items-center">
              <div>
                <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Review Due</span>
                <p className={`text-[12px] mt-0.5 ${notificationsDisabled ? "text-gray-200" : "text-gray-400"}`}>
                  Notify when cards are ready for review
                </p>
              </div>
              <Toggle
                checked={prefs.review_due_enabled}
                onChange={(v) => updatePrefs({ review_due_enabled: v })}
                disabled={notificationsDisabled}
              />
            </div>

            {/* Achievements */}
            <div className="px-4 py-3.5 flex justify-between items-center">
              <div>
                <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Achievements</span>
                <p className={`text-[12px] mt-0.5 ${notificationsDisabled ? "text-gray-200" : "text-gray-400"}`}>
                  Celebrate milestones and progress
                </p>
              </div>
              <Toggle
                checked={prefs.achievements_enabled}
                onChange={(v) => updatePrefs({ achievements_enabled: v })}
                disabled={notificationsDisabled}
              />
            </div>

            {/* Inactivity Nudge */}
            <div className="px-4 py-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className={`text-[15px] font-medium ${notificationsDisabled ? "text-gray-300" : ""}`}>Inactivity Nudge</span>
                  <p className={`text-[12px] mt-0.5 ${notificationsDisabled ? "text-gray-200" : "text-gray-400"}`}>
                    Remind if inactive for {prefs.inactivity_nudge_days} day{prefs.inactivity_nudge_days > 1 ? "s" : ""}
                  </p>
                </div>
                <Toggle
                  checked={prefs.inactivity_nudge_enabled}
                  onChange={(v) => updatePrefs({ inactivity_nudge_enabled: v })}
                  disabled={notificationsDisabled}
                />
              </div>
              {prefs.inactivity_nudge_enabled && !notificationsDisabled && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[13px] text-gray-500 shrink-0">After</span>
                  <input
                    type="range"
                    min={1}
                    max={14}
                    value={prefs.inactivity_nudge_days}
                    onChange={(e) => updatePrefs({ inactivity_nudge_days: parseInt(e.target.value) })}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-[13px] font-medium text-gray-700 w-16 text-right">
                    {prefs.inactivity_nudge_days} day{prefs.inactivity_nudge_days > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-xl bg-red-50 text-red-500 font-semibold text-[16px] active:scale-[0.98] transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* Add Language Sheet */}
      <Sheet
        opened={addSheetOpen}
        onBackdropClick={() => setAddSheetOpen(false)}
        className="pb-safe"
      >
        <div className="px-5 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-[15px] font-medium"
            onClick={() => setAddSheetOpen(false)}
          >
            Cancel
          </button>
          <span className="font-semibold text-[16px]">Add Language</span>
          <button
            className={`text-[15px] font-semibold ${selectedLang ? "text-blue-500" : "text-gray-300"}`}
            onClick={handleAddLanguage}
            disabled={!selectedLang || adding}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
        <List strongIos insetIos className="max-h-80 overflow-y-auto scrollbar-hide">
          {availableLanguages.map((lang) => (
            <ListItem
              key={lang.code}
              title={lang.name}
              media={<span className="text-xl">{lang.icon}</span>}
              after={
                <Radio
                  checked={selectedLang === lang.code}
                  onChange={() => setSelectedLang(lang.code)}
                />
              }
              onClick={() => setSelectedLang(lang.code)}
            />
          ))}
        </List>
      </Sheet>

      {/* Delete Language Confirmation Sheet */}
      <Sheet
        opened={!!deleteConfirmEnvId}
        onBackdropClick={() => setDeleteConfirmEnvId(null)}
        className="pb-safe !z-[99999]"
      >
        <div className="px-5 py-6 text-center">
          <div className="text-4xl mb-3">{deleteEnv?.icon ?? "🌍"}</div>
          <h3 className="text-[17px] font-bold mb-2">
            Delete {deleteEnv ? getLangName(deleteEnv.target_lang) : ""}?
          </h3>
          <p className="text-[14px] text-gray-500 mb-6">
            This will permanently delete all decks, words, and training history for this language.
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-[15px] active:scale-[0.98] transition-all"
              onClick={() => setDeleteConfirmEnvId(null)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={handleDeleteLanguage}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Change Password Sheet */}
      <Sheet
        opened={passwordSheetOpen}
        onBackdropClick={() => setPasswordSheetOpen(false)}
        className="pb-safe"
      >
        <div className="px-5 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-[15px] font-medium"
            onClick={() => setPasswordSheetOpen(false)}
          >
            Cancel
          </button>
          <span className="font-semibold text-[16px]">Change Password</span>
          <button
            className={`text-[15px] font-semibold ${newPw && confirmPw ? "text-blue-500" : "text-gray-300"}`}
            onClick={handleChangePassword}
            disabled={pwLoading || !newPw || !confirmPw}
          >
            {pwLoading ? "Saving..." : "Save"}
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {pwSuccess ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-[15px] font-medium text-green-600">Password updated!</p>
            </div>
          ) : (
            <>
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              {pwError && (
                <p className="text-red-500 text-center text-sm bg-red-50 rounded-xl py-2.5 px-4">{pwError}</p>
              )}
            </>
          )}
        </div>
      </Sheet>

      {/* Daily Goal Sheet */}
      <Sheet
        opened={goalSheetOpen}
        onBackdropClick={() => setGoalSheetOpen(false)}
        className="pb-safe"
      >
        <div className="px-5 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-[15px] font-medium"
            onClick={() => setGoalSheetOpen(false)}
          >
            Cancel
          </button>
          <span className="font-semibold text-[16px]">Daily Goal</span>
          <button
            className="text-blue-500 text-[15px] font-semibold"
            onClick={handleSaveGoal}
          >
            Save
          </button>
        </div>
        <div className="px-5 py-4 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[15px] font-medium">Words per day</span>
              <span className="text-[20px] font-bold text-blue-500">{tempGoalWords}</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={tempGoalWords}
              onChange={(e) => setTempGoalWords(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>5</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[15px] font-medium">Sessions per day</span>
              <span className="text-[20px] font-bold text-blue-500">{tempGoalSessions}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setTempGoalSessions(n)}
                  className={`flex-1 py-2.5 rounded-xl text-[15px] font-semibold transition-colors ${
                    tempGoalSessions === n
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
